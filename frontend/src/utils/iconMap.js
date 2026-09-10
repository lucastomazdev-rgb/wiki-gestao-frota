import {
  BookOpen,
  Shield,
  Cpu,
  Wrench,
  FileText,
  AlertTriangle,
  TrendingUp,
  Download,
  FolderOpen
} from 'lucide-react';
import { CocaColaBottle, SodaCan } from '../components/icons/CocaColaIcons';

export const ICON_MAP = {
  BookOpen,
  Shield,
  Cpu,
  Wrench,
  FileText,
  AlertTriangle,
  TrendingUp,
  Download,
  FolderOpen,
  CocaCola: CocaColaBottle,
  CocaColaBottle,
  SodaCan
};

export const AVAILABLE_ICON_NAMES = [
  'BookOpen',
  'Shield',
  'Cpu',
  'Wrench',
  'FileText',
  'AlertTriangle',
  'TrendingUp',
  'Download',
  'CocaCola',
  'SodaCan'
];

export function getCategoryIcon(iconName, fallback = FolderOpen) {
  return ICON_MAP[iconName] || fallback;
}

export default ICON_MAP;
