/**
 * Utilitários para formatação e manipulação de telefones brasileiros
 */

/**
 * Remove todos os caracteres não numéricos.
 */
export const limparTelefone = (valor = '') => {
  return String(valor || '').replace(/\D/g, '');
};

/**
 * Aplica máscara de telefone brasileiro em tempo real:
 * - Fixo: (XX) XXXX-XXXX
 * - Celular: (XX) XXXXX-XXXX
 */
export const mascaraTelefone = (valor = '') => {
  const digits = limparTelefone(valor).slice(0, 11);
  
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

/**
 * Formata um telefone existente para exibição padronizada.
 */
export const formatarTelefone = (valor = '') => {
  if (!valor) return '';
  return mascaraTelefone(valor);
};

/**
 * Gera URL de WhatsApp limpa (com DDI 55 para o Brasil).
 */
export const gerarLinkWhatsApp = (telefone = '') => {
  const digits = limparTelefone(telefone);
  if (!digits) return null;
  // Se já começar com 55 e tiver 12 ou 13 dígitos
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return `https://wa.me/${digits}`;
  }
  return `https://wa.me/55${digits}`;
};
