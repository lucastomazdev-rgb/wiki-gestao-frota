/**
 * Serviço de Trilha de Auditoria (Audit Trail)
 * Registra de forma estruturada ações administrativas e operações sensíveis.
 */

export const recordAuditEvent = ({
  action,
  performedBy = null,
  target = null,
  ip = null,
  status = 'SUCCESS',
  details = null
}) => {
  const event = {
    timestamp: new Date().toISOString(),
    action,
    performedBy: performedBy
      ? { id: performedBy.id, email: performedBy.email, role: performedBy.role }
      : 'ANONYMOUS_OR_SYSTEM',
    target,
    ip: ip || 'unknown',
    status,
    details
  };

  // Log estruturado em JSON com prefixo padrão para monitoramento e SIEM
  console.info(`[AUDIT] ${JSON.stringify(event)}`);
  return event;
};
