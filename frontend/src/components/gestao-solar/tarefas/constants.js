export const COLUMNS = ['Demandas', 'Em andamento', 'Aguardando Retorno', 'Concluído'];

export const TASK_CATEGORIES = [
  {
    id: 'Configuração/Perfil',
    label: 'Configuração/Perfil',
    shortLabel: 'Configuração',
    description: 'Ajustes de parâmetros, perfis e configurações de rastreadores',
    color: 'sky',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80 hover:bg-sky-100/70',
    dotClass: 'bg-sky-500',
    hoverBorder: 'group-hover:border-sky-300'
  },
  {
    id: 'Manutenção',
    label: 'Manutenção',
    shortLabel: 'Manutenção',
    description: 'Reparos, revisões físicas, trocas e diagnósticos em veículos',
    color: 'amber',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/70',
    dotClass: 'bg-amber-500',
    hoverBorder: 'group-hover:border-amber-300'
  }
];

export const DEFAULT_NEW_TASK = {
  titulo: '',
  descricao: '',
  categoria: '',
  status: 'Demandas',
  atribuido_a: '',
  prioridade: 'Normal'
};

