import { AsyncLocalStorage } from 'node:async_hooks';
import { performance } from 'node:perf_hooks';

export const perfStorage = new AsyncLocalStorage();

/**
 * Registra métricas de execução de query do Prisma associadas à requisição atual.
 */
export function recordPrismaMetric(model, operation, durationMs) {
  const store = perfStorage.getStore();
  if (store) {
    store.dbTime += durationMs;
    store.dbQueries.push({ model, operation, duration: durationMs });
  }

  // Alerta queries lentas no terminal do backend
  if (durationMs > 300) {
    console.warn(`\x1b[33m⚠️ [Prisma SLOW QUERY] ${model}.${operation} executou em ${durationMs.toFixed(1)}ms\x1b[0m`);
  }
}

/**
 * Extensão do Prisma Client para mensurar o tempo de cada operação de banco.
 */
export function instrumentPrisma(basePrisma) {
  return basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = performance.now();
          try {
            return await query(args);
          } finally {
            const duration = Math.round((performance.now() - start) * 10) / 10;
            recordPrismaMetric(model, operation, duration);
          }
        }
      }
    }
  });
}

/**
 * Middleware Express para capturar telemetria e injetar cabeçalhos Server-Timing.
 */
export function perfTelemetryMiddleware(req, res, next) {
  if (req.path === '/favicon.ico' || req.path === '/api/health') {
    return next();
  }

  const store = {
    startTime: performance.now(),
    dbTime: 0,
    dbQueries: [],
    method: req.method,
    path: req.originalUrl || req.url
  };

  const setTimingHeaders = () => {
    if (res.headersSent) return;

    const totalMs = Math.round((performance.now() - store.startTime) * 10) / 10;
    const dbMs = Math.round(store.dbTime * 10) / 10;
    const appMs = Math.max(0, Math.round((totalMs - dbMs) * 10) / 10);
    const qCount = store.dbQueries.length;

    res.setHeader('Server-Timing', `total;dur=${totalMs}, db;dur=${dbMs}, app;dur=${appMs}`);
    res.setHeader('X-Response-Time', `${totalMs}ms`);
    res.setHeader('X-Database-Time', `${dbMs}ms`);
    res.setHeader('X-Database-Queries', String(qCount));
  };

  const origSend = res.send;
  res.send = function (body) {
    setTimingHeaders();
    return origSend.call(this, body);
  };

  const origJson = res.json;
  res.json = function (body) {
    setTimingHeaders();
    return origJson.call(this, body);
  };

  const origEnd = res.end;
  res.end = function (chunk, encoding) {
    setTimingHeaders();
    return origEnd.call(this, chunk, encoding);
  };

  res.on('finish', () => {
    const totalMs = Math.round(performance.now() - store.startTime);
    const dbMs = Math.round(store.dbTime);
    const appMs = Math.max(0, totalMs - dbMs);
    const qCount = store.dbQueries.length;

    const statusColor = res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';
    const speedIcon = totalMs > 1200 ? '🐌' : totalMs > 500 ? '⚠️' : '⚡';

    console.log(
      `${speedIcon} [API ⏱️] ${req.method} ${store.path} ${statusColor}${res.statusCode}${reset} ` +
      `Total: ${totalMs}ms (DB Supabase: ${dbMs}ms [${qCount}q] | Render CPU: ${appMs}ms)`
    );
  });

  perfStorage.run(store, next);
}
