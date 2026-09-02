import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const LOOKUP_STALE_TIME = 1000 * 60 * 15;

const sortByNome = (items = [], key = 'nome_unidade') =>
  [...items].sort((a, b) => String(a?.[key] || '').localeCompare(String(b?.[key] || '')));

export function useUnidadesLookup() {
  return useQuery({
    queryKey: ['lookup', 'unidades'],
    queryFn: async () => {
      const response = await api.get('/unidades');
      return sortByNome(response.data || [], 'nome_unidade');
    },
    staleTime: LOOKUP_STALE_TIME,
    gcTime: LOOKUP_STALE_TIME * 2,
  });
}

export function useModelosLookup() {
  return useQuery({
    queryKey: ['lookup', 'modelos'],
    queryFn: async () => {
      const response = await api.get('/modelos');
      return sortByNome(response.data || [], 'nome_modelo');
    },
    staleTime: LOOKUP_STALE_TIME,
    gcTime: LOOKUP_STALE_TIME * 2,
  });
}

export function useLookupOptions() {
  const { data: unidades = [] } = useUnidadesLookup();
  const { data: modelos = [] } = useModelosLookup();

  return useMemo(() => ({
    unidades,
    modelos
  }), [unidades, modelos]);
}
