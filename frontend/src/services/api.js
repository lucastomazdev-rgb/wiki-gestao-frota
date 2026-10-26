import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 60000, // 60s para suportar cold-start da Render no plano gratuito
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  }
});

let coldStartToastShown = false;

api.interceptors.request.use((config) => {
  config.metadata = { startTime: performance.now() };
  return config;
});

api.interceptors.response.use(
  (response) => {
    coldStartToastShown = false;

    // ⏱️ Telemetria de Performance End-to-End
    const startTime = response.config?.metadata?.startTime;
    if (startTime) {
      const totalRtt = Math.round(performance.now() - startTime);
      const serverTimingHeader = response.headers?.['server-timing'];
      const xResponseTime = response.headers?.['x-response-time'];
      const xDbTime = response.headers?.['x-database-time'];
      const xDbQueries = response.headers?.['x-database-queries'];

      let serverMs = null;
      let dbMs = null;

      if (serverTimingHeader) {
        const totalMatch = serverTimingHeader.match(/total;dur=([\d.]+)/);
        const dbMatch = serverTimingHeader.match(/db;dur=([\d.]+)/);
        if (totalMatch) serverMs = Math.round(parseFloat(totalMatch[1]));
        if (dbMatch) dbMs = Math.round(parseFloat(dbMatch[1]));
      } else if (xResponseTime) {
        serverMs = parseInt(xResponseTime, 10);
      }

      const networkRtt = serverMs !== null ? Math.max(0, totalRtt - serverMs) : totalRtt;
      const url = response.config.url || '';
      const method = (response.config.method || 'GET').toUpperCase();

      const badgeBg = totalRtt > 1500 ? '#ef4444' : totalRtt > 600 ? '#f59e0b' : '#10b981';
      const speedIcon = totalRtt > 1500 ? '🐌' : totalRtt > 600 ? '⚠️' : '⚡';

      const serverDetails = serverMs !== null
        ? `(Servidor Render: ${serverMs}ms ${dbMs !== null ? `[DB Supabase: ${dbMs}ms | ${xDbQueries || 1}q]` : ''} | Rede/RTT: ${networkRtt}ms)`
        : `(RTT Total: ${totalRtt}ms)`;

      console.log(
        `%c${speedIcon} [API] ${method} ${url}%c ${totalRtt}ms %c${serverDetails}`,
        'color: #38bdf8; font-weight: bold;',
        `background: ${badgeBg}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin: 0 4px;`,
        'color: #94a3b8; font-style: italic;'
      );
    }

    return response;
  },
  (error) => {
    const startTime = error.config?.metadata?.startTime;
    if (startTime) {
      const totalRtt = Math.round(performance.now() - startTime);
      const url = error.config?.url || '';
      const method = (error.config?.method || 'GET').toUpperCase();
      console.warn(
        `%c❌ [API FALHA] ${method} ${url}%c ${totalRtt}ms %cStatus: ${error.response?.status || 'Network Error'}`,
        'color: #ef4444; font-weight: bold;',
        'background: #dc2626; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin: 0 4px;',
        'color: #f87171;'
      );
    }

    // Detecta cold start da Render (timeout ou falha de conexão inicial)
    const isTimeout = error.code === 'ECONNABORTED' || String(error.message || '').includes('timeout');
    const isNetworkError = !error.response && error.code === 'ERR_NETWORK';

    if ((isTimeout || isNetworkError) && !coldStartToastShown) {
      coldStartToastShown = true;
      toast('O servidor em nuvem está acordando. Isso leva cerca de 40s no plano gratuito. Aguarde um instante...', {
        icon: '⏳',
        duration: 8000,
        id: 'cold-start-notice'
      });
      setTimeout(() => {
        coldStartToastShown = false;
      }, 15000);
    }

    return Promise.reject(error);
  }
);

export default api;
