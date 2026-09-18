import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  AlertCircle, 
  Loader, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  X,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [requiresSetup, setRequiresSetup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [setupTokenConfigured, setSetupTokenConfigured] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.get('/auth/setup-status')
      .then(res => {
        if (isMounted) {
          setSetupTokenConfigured(Boolean(res.data?.data?.setupTokenConfigured));
          if (res.data?.data?.requiresSetup) {
            setRequiresSetup(true);
            setIsRegister(true);
          }
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      errors.email = 'E-mail é obrigatório';
    } else if (!emailRegex.test(email)) {
      errors.email = 'E-mail inválido';
    }

    if (!password) {
      errors.password = 'Senha é obrigatória';
    } else if (isRegister && password.length < 12) {
      errors.password = 'A senha deve conter pelo menos 12 caracteres';
    }

    if (isRegister && !name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (requiresSetup && setupToken.length < 32) {
      errors.setupToken = 'Informe o token inicial de ao menos 32 caracteres';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (isRegister) {
        await register(email, password, name, requiresSetup ? setupToken : '');
      } else {
        await login(email, password);
      }
    } catch (err) {
      setApiError(err.message || 'Falha na autenticação. Verifique os dados informados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center p-3 sm:p-5 lg:p-6 bg-[#070b14] relative overflow-y-auto lg:overflow-hidden font-sans select-none">
      {/* Luzes de fundo atmosféricas (Wiki Slate & Amber) */}
      <div className="absolute -top-32 -left-32 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 sm:w-[550px] h-80 sm:h-[550px] bg-sky-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-amber-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* CARTÃO PRINCIPAL (Amplo, widescreen e perfeitamente ajustado à tela) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[1100px] xl:max-w-[1160px] max-h-[96vh] rounded-3xl lg:rounded-[2.4rem] bg-[#0c1322]/95 border border-white/10 shadow-[0_25px_90px_-15px_rgba(0,0,0,0.9)] overflow-hidden my-auto flex flex-col justify-center"
      >
        {/* ELEMENTOS GEOMÉTRICOS ABSTRATOS DE FUNDO */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Linhas verticais no canto superior esquerdo */}
          <div className="absolute top-6 left-16 sm:left-20 w-1 sm:w-1.5 h-16 sm:h-20 bg-white/5 rounded-full" />
          <div className="absolute top-6 left-24 sm:left-28 w-1 sm:w-1.5 h-24 sm:h-28 bg-white/5 rounded-full" />

          {/* Cápsula / Pill diagonal translúcida em destaque (cruzando atrás do card) */}
          <div 
            className="absolute -top-16 right-20 lg:right-28 w-32 sm:w-36 lg:w-40 h-[420px] lg:h-[480px] rounded-full bg-gradient-to-b from-sky-400/10 via-sky-400/5 to-transparent border border-white/10 transform -rotate-[38deg] backdrop-blur-[2px]" 
          />
          {/* Segunda cápsula diagonal sutil */}
          <div 
            className="absolute top-28 -right-8 w-24 sm:w-28 h-[360px] sm:h-[400px] rounded-full bg-gradient-to-b from-amber-500/10 to-transparent border border-white/5 transform -rotate-[38deg]" 
          />

          {/* Círculo decorativo no canto inferior direito */}
          <div className="absolute -bottom-24 right-24 w-60 sm:w-72 h-60 sm:h-72 rounded-full border border-sky-400/15 pointer-events-none" />

          {/* Linhas de contorno e circuitos suaves em SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M 50 480 C 50 430, 100 400, 150 400 L 320 400 C 370 400, 420 350, 420 300 L 420 200 C 420 150, 470 120, 520 120 L 720 120 C 780 120, 830 170, 830 230"
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 110 500 C 110 450, 150 430, 200 430 L 360 430 C 410 430, 450 390, 450 340 L 450 260"
              fill="none"
              stroke="rgba(56, 189, 248, 0.08)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Triângulo / elemento angular na base central */}
          <div 
            className="absolute -bottom-20 left-1/3 w-52 sm:w-60 h-52 sm:h-60 border-t-2 border-l-2 border-white/5 transform rotate-45"
          />
        </div>

        {/* CONTEÚDO EM GRID (Espaçoso na horizontal, equilibrado na vertical) */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 p-6 sm:p-8 lg:py-8 lg:px-12 xl:py-10 xl:px-16 gap-8 lg:gap-10 xl:gap-14 items-center">
          
          {/* COLUNA ESQUERDA: IDENTIDADE & BOAS-VINDAS */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center text-left">
            
            {/* Logotipo oficial acima do Bem vindo */}
            <div className="mb-4 sm:mb-5 lg:mb-6 flex items-center">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500/30 to-sky-500/30 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-all duration-300" />
                <img
                  src="/images/LOGOELETRONICACIRCLE.svg"
                  alt="Logo Eletrônica Wiki Frota"
                  className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-contain relative drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)] transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>

            {/* Título de Boas-Vindas */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white tracking-tight leading-none">
              Bem vindo!
            </h1>

            {/* Traço de destaque sutil */}
            <div className="w-12 sm:w-14 lg:w-16 h-1 bg-amber-500 rounded-full my-3 sm:my-3.5 lg:my-4 shadow-sm shadow-amber-500/40" />

            {/* Texto descritivo */}
            <p className="text-slate-300 text-xs sm:text-sm lg:text-[15px] xl:text-base leading-relaxed max-w-md font-normal">
              Wiki de gestão de frota focado em tutoriais e treinamentos do setor de frotas
            </p>

            {/* Botão Saiba Mais */}
            <div className="mt-5 sm:mt-6 lg:mt-7">
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md shadow-amber-500/20 hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>Saiba Mais</span>
                <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* COLUNA DIREITA: CARD EM GLASSMORPHISM (Sign in) */}
          <div className="lg:col-span-5 xl:col-span-5 flex items-center justify-center w-full">
            <div className="w-full max-w-[360px] sm:max-w-[390px] lg:max-w-[380px] xl:max-w-[420px] bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-7 lg:p-7 xl:p-8 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)] relative">
              
              {/* Cabeçalho do Card */}
              <div className="text-center mb-5 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight inline-block relative">
                  Ent<span className="relative">
                    rar
                    <span className="absolute left-0 -bottom-1 w-full h-[3px] bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" />
                  </span>
                </h2>
                {requiresSetup && (
                  <p className="text-[11px] text-amber-400 font-medium mt-1.5">
                    Configuração Inicial do Administrador
                  </p>
                )}
              </div>

              {/* Mensagem de Erro da API */}
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/25 text-red-300 text-xs rounded-xl flex items-start gap-2 backdrop-blur-md"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                  <span className="leading-tight text-xs">{apiError}</span>
                </motion.div>
              )}

              {/* Formulário de Login */}
              <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                
                {/* Campo Especial: Token de Setup */}
                {requiresSetup && (
                  <div>
                    <label 
                      htmlFor="setup-token" 
                      className="block text-xs font-semibold text-slate-300 mb-1 ml-0.5"
                    >
                      Token de Configuração Inicial
                    </label>
                    <div className="relative">
                      <input
                        id="setup-token"
                        type="password"
                        autoComplete="off"
                        value={setupToken}
                        onChange={(e) => setSetupToken(e.target.value)}
                        placeholder="Informe o token mestre..."
                        className={`w-full bg-white/[0.06] border ${
                          validationErrors.setupToken ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-amber-500/60'
                        } text-white px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl outline-none transition-all placeholder:text-slate-500 focus:bg-white/[0.09]`}
                      />
                    </div>
                    {validationErrors.setupToken && (
                      <span className="text-[11px] text-red-400 mt-1 ml-0.5 block">{validationErrors.setupToken}</span>
                    )}
                    {!setupTokenConfigured && (
                      <span className="text-[11px] text-amber-400 mt-1 ml-0.5 block">
                        Defina INITIAL_SETUP_TOKEN no ambiente.
                      </span>
                    )}
                  </div>
                )}

                {/* Campo Especial: Nome Completo */}
                {isRegister && (
                  <div>
                    <label 
                      htmlFor="name" 
                      className="block text-xs font-semibold text-slate-300 mb-1 ml-0.5"
                    >
                      Nome Completo
                    </label>
                    <div className="relative">
                      <input
                        id="name"
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Carlos Silva"
                        className={`w-full bg-white/[0.06] border ${
                          validationErrors.name ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-amber-500/60'
                        } text-white px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl outline-none transition-all placeholder:text-slate-500 focus:bg-white/[0.09]`}
                      />
                    </div>
                    {validationErrors.name && (
                      <span className="text-[11px] text-red-400 mt-1 ml-0.5 block">{validationErrors.name}</span>
                    )}
                  </div>
                )}

                {/* Campo 1: Usuário / E-mail */}
                <div>
                  <label 
                    htmlFor="email" 
                    className="block text-xs font-semibold text-slate-300 mb-1.5 ml-0.5"
                  >
                    Usuário ou E-mail
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@corpvs.com.br"
                      className={`w-full bg-white/[0.06] border ${
                        validationErrors.email ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-amber-500/60'
                      } text-white px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl outline-none transition-all placeholder:text-slate-500 focus:bg-white/[0.09]`}
                    />
                  </div>
                  {validationErrors.email && (
                    <span className="text-[11px] text-red-400 mt-1 ml-0.5 block">{validationErrors.email}</span>
                  )}
                </div>

                {/* Campo 2: Senha */}
                <div>
                  <label 
                    htmlFor="password" 
                    className="block text-xs font-semibold text-slate-300 mb-1.5 ml-0.5"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isRegister ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className={`w-full bg-white/[0.06] border ${
                        validationErrors.password ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-amber-500/60'
                      } text-white pl-4 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl outline-none transition-all placeholder:text-slate-500 focus:bg-white/[0.09]`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <span className="text-[11px] text-red-400 mt-1 ml-0.5 block">{validationErrors.password}</span>
                  )}
                </div>

                {/* Botão Entrar */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:via-orange-400 hover:to-amber-500 text-slate-950 font-bold py-3 px-6 rounded-full text-xs sm:text-sm tracking-wide transition-all duration-200 shadow-md shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader size={17} className="animate-spin text-slate-950" />
                    ) : requiresSetup ? (
                      'Criar Administrador'
                    ) : (
                      'Entrar'
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>

        </div>
      </motion.div>

      {/* MODAL INFORMATIVO "SAIBA MAIS" */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="bg-slate-900/95 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Fechar modal"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">Wiki Gestão de Frota</h3>
                  <p className="text-xs text-amber-400 font-medium">Plataforma Oficial de Conhecimento</p>
                </div>
              </div>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
                A Wiki centraliza todos os procedimentos operacionais, manuais de telemetria, fluxogramas de manutenção e módulos de capacitação contínua da equipe.
              </p>

              <div className="space-y-2 mb-5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-amber-400 shrink-0" />
                  <span>Tutoriais práticos de instalação e diagnóstico</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-amber-400 shrink-0" />
                  <span>Manuais técnicos dos rastreadores e sensores</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-amber-400 shrink-0" />
                  <span>Controle de acessos e diretrizes do setor</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Entendi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
