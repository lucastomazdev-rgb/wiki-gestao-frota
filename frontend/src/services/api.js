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

api.interceptors.response.use(
  (response) => {
    coldStartToastShown = false;
    return response;
  },
  (error) => {
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
