import api from './api';

export const openTechnicianDocument = async (technicianId, type) => {
  const popup = window.open('about:blank', '_blank');
  if (popup) popup.opener = null;

  try {
    const response = await api.get(`/gestao-solar/tecnicos/${technicianId}/documentos/${type}`);
    const url = response.data?.data?.url;
    if (!url) throw new Error('URL do documento não recebida.');

    if (popup) {
      popup.location.replace(url);
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    }
  } catch (error) {
    popup?.close();
    throw error;
  }
};
