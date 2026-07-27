import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, AlertCircle, Loader, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } else if (password.length < 6) {
      errors.password = 'A senha deve conter pelo menos 6 caracteres';
    }

    if (isRegister && !name.trim()) {
      errors.name = 'Nome é obrigatório';
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
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setApiError(err.message || 'Falha na autenticação. Verifique os dados fornecidos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-950 relative overflow-hidden">
      {/* Soft ambient glowing background orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full filter blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-sky-500/10 rounded-full filter blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl relative shadow-2xl"
      >
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-tr from-red-600 to-red-500 text-white rounded-2xl mb-3 shadow-lg shadow-red-950/40">
            <BookOpen size={28} strokeWidth={2.5} />
          </div>
          <h1 className="font-display font-black text-2xl text-white tracking-widest leading-none uppercase">
            SOLAR
          </h1>
          <p className="text-xs font-mono tracking-widest text-red-400 uppercase font-bold mt-1.5">
            CONTROLE DE ACESSO • FROTA WIKI
          </p>
        </div>

        {apiError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-3.5 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-start gap-2.5 backdrop-blur-md"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5 font-medium">
                Nome Completo
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className={`w-full bg-slate-800/60 border ${
                    validationErrors.name ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-red-500'
                  } text-white pl-10 pr-4 py-3 text-sm rounded-xl outline-none transition-all font-sans`}
                />
              </div>
              {validationErrors.name && (
                <span className="text-[10px] text-red-400 mt-1 block font-mono">{validationErrors.name}</span>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5 font-medium">
              E-mail Operacional
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome.sobrenome@solar.com"
                className={`w-full bg-slate-800/60 border ${
                  validationErrors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-red-500'
                } text-white pl-10 pr-4 py-3 text-sm rounded-xl outline-none transition-all font-sans`}
              />
            </div>
            {validationErrors.email && (
              <span className="text-[10px] text-red-400 mt-1 block font-mono">{validationErrors.email}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5 font-medium">
              Senha de Acesso
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className={`w-full bg-slate-800/60 border ${
                  validationErrors.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-red-500'
                } text-white pl-10 pr-4 py-3 text-sm rounded-xl outline-none transition-all font-sans`}
              />
            </div>
            {validationErrors.password && (
              <span className="text-[10px] text-red-400 mt-1 block font-mono">{validationErrors.password}</span>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-mono text-xs uppercase tracking-wider font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <Loader size={16} className="animate-spin" />
            ) : isRegister ? (
              'Criar Cadastro Técnico'
            ) : (
              'Autenticar Acesso'
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center border-t border-white/10 pt-4">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setValidationErrors({});
              setApiError('');
            }}
            className="text-xs text-slate-400 hover:text-red-400 transition-colors font-mono uppercase tracking-wider"
          >
            {isRegister ? 'Já tenho login operacional' : 'Criar novo acesso técnico'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
