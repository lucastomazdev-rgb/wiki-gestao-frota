import React, { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/useAuth';
import toast from 'react-hot-toast';
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const MAX_TENTATIVAS = 5;
const LOCKOUT_SEGUNDOS = 60;
const COOLDOWN_MS = 2000;
const AUTH_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

export default function Login() {
  const { setSession } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const tentativasRef = useRef(0);
  const cooldownRef = useRef(false);

  // Countdown timer visual durante lockout
  useEffect(() => {
    if (countdown <= 0) {
      setBloqueado(false);
      return;
    }
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const iniciarLockout = useCallback(() => {
    setBloqueado(true);
    setCountdown(LOCKOUT_SEGUNDOS);
    toast.error(`Muitas tentativas falhas. Aguarde ${LOCKOUT_SEGUNDOS}s antes de tentar novamente.`, { duration: 5000 });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    // SEC-04: Bloqueio ativo — não permite submissão
    if (bloqueado || cooldownRef.current) return;

    setCarregando(true);

    try {
      const { data } = await axios.post(`${AUTH_BASE_URL}/auth/login`, {
        email,
        password: senha
      });

      const backendSession = data?.session;
      if (!backendSession?.access_token || !backendSession?.refresh_token) {
        throw new Error('Sessao invalida retornada pelo backend.');
      }

      const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
        access_token: backendSession.access_token,
        refresh_token: backendSession.refresh_token
      });

      if (setSessionError || !sessionData?.session) {
        throw setSessionError || new Error('Falha ao ativar sessao local.');
      }

      tentativasRef.current = 0;

      // LÓGICA DE SESSÃO ÚNICA
      const sessionKey = crypto.randomUUID();
      const userId = sessionData.session.user.id;

      const { error: sessionError } = await supabase
        .from('sessao_ativa')
        .upsert({ user_id: userId, session_key: sessionKey });

      if (sessionError) throw sessionError;

      localStorage.setItem('active_session_key', sessionKey);
      localStorage.setItem('login_timestamp', Date.now().toString());
      setSession(sessionData.session);
      toast.success('Acesso Validado!', { position: 'top-right' });
    } catch (error) {
      const status = error?.response?.status;
      const mensagem = String(error?.response?.data?.erro || '').toLowerCase();

      if (status === 401) {
        tentativasRef.current += 1;
        toast.error('Credenciais inválidas. Verifique seu e-mail e senha.', { position: 'top-right' });

        // SEC-04: Lockout após MAX_TENTATIVAS consecutivas
        if (tentativasRef.current >= MAX_TENTATIVAS) {
          tentativasRef.current = 0;
          iniciarLockout();
        } else {
          // Cooldown de 2s entre tentativas falhas
          cooldownRef.current = true;
          setTimeout(() => { cooldownRef.current = false; }, COOLDOWN_MS);
        }

        setCarregando(false);
        return;
      }

      if (status === 429 || mensagem.includes('muitas tentativas')) {
        toast.error('Muitas tentativas de login. Tente novamente em 15 minutos.', { duration: 5000 });
        setCarregando(false);
        return;
      }

      await supabase.auth.signOut({ scope: 'local' });
      toast.error('Falha ao validar segurança da sessão.');
    }

    setCarregando(false);
  };

  return (
    <div 
      className="flex min-h-screen w-full items-center justify-center bg-slate-950 font-sans overflow-x-hidden bg-cover bg-center bg-no-repeat bg-fixed relative py-8 px-4"
      style={{ backgroundImage: "url('/fundo.jpeg')" }}
    >
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-0" />
      
      <div className="z-10 w-full max-w-[420px] lg:max-w-[850px] animate-fade-in-up p-4">
        {/* CARD PRINCIPAL COM GRID SPLIT EM DESKTOP */}
        <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col lg:flex-row">
          
          {/* COLUNA ESQUERDA: BRANDING (Visível lado a lado em Desktop) */}
          <div className="w-full lg:w-5/12 p-8 sm:p-10 lg:p-12 flex flex-col items-center justify-center text-center bg-slate-950/20 lg:border-r border-white/5 relative group">
            {/* Efeito de brilho de fundo na logo */}
            <div className="absolute inset-0 bg-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-3xl pointer-events-none" />
            
            <img 
              src="/logo.png" 
              alt="Logo Gestão Frota" 
              className="w-40 sm:w-48 lg:w-52 object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)] mb-8 hover:scale-105 transition-all duration-700 relative z-10" 
            />
            
            <div className="relative z-10">
              <p className="text-[10px] sm:text-[11px] text-teal-400 font-black uppercase tracking-[0.4em] drop-shadow-md">
                Gestão Operacional de Frotas
              </p>
            </div>
          </div>

          {/* COLUNA DIREITA: FORMULÁRIO DE LOGIN */}
          <div className="w-full lg:w-7/12 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
            {/* Divisor visual discreto apenas para mobile (opcional) */}
            <div className="mb-6 lg:hidden flex items-center gap-4 opacity-20">
              <div className="h-px flex-1 bg-white" />
              <div className="h-1 w-1 rounded-full bg-white" />
              <div className="h-px flex-1 bg-white" />
            </div>

            <form onSubmit={handleLogin} className="space-y-5" aria-label="Formulário de login">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={16} className="text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                </div>
                <input 
                  type="email" 
                  required
                  aria-label="E-mail de acesso"
                  className="w-full bg-slate-950/60 border border-slate-700/50 rounded-2xl pl-12 pr-5 py-3.5 sm:py-4 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all placeholder-slate-500 shadow-inner"
                  placeholder="E-mail de acesso"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockKeyhole size={16} className="text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                </div>
                <input 
                  type="password" 
                  required
                  aria-label="Senha de segurança"
                  className="w-full bg-slate-950/60 border border-slate-700/50 rounded-2xl pl-12 pr-5 py-3.5 sm:py-4 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all placeholder-slate-500 shadow-inner"
                  placeholder="Senha de segurança"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={carregando || bloqueado}
                className={`w-full mt-4 bg-gradient-to-r ${bloqueado ? 'from-red-700 to-red-600' : 'from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400'} text-white font-black py-4 px-4 rounded-2xl shadow-[0_10px_40px_rgba(20,184,166,0.3)] hover:shadow-[0_15px_50px_rgba(20,184,166,0.5)] transition-all duration-300 flex justify-center items-center hover:-translate-y-1 active:scale-[0.98] tracking-[0.1em] uppercase text-[11px] ${(carregando || bloqueado) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {bloqueado ? (
                  `Bloqueado — ${countdown}s`
                ) : carregando ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Acessar Conta'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-slate-500">
               <ShieldCheck size={14} />
               <span className="text-[10px] font-bold uppercase tracking-widest text-center">Ambiente restrito • Acesso Seguro SSL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

