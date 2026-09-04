import { useAuth } from '../context/AuthContext';

export { useAuth };
export default function useAuthDefault() {
  return useAuth();
}
