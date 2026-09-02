import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/useAuth';
import { UserCircle, ShieldCheck, Mail, Lock, KeyRound, Save, Image, Fingerprint, Crown, Briefcase } from 'lucide-react';
import api from '../services/api';
import { supabase } from '../services/supabase';

const Perfil = () => {
    const { getNomePerfil, updateSessionMetadata, isAdmin } = useAuth();
    
    const [loadingInfo, setLoadingInfo] = useState(true);
    const [profileData, setProfileData] = useState(null);
    
    // Estados do Formulário de Info
    const [nome, setNome] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [loadingSalvarInfo, setLoadingSalvarInfo] = useState(false);

    // Estados do Formulário de Senha
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loadingSenha, setLoadingSenha] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const { data } = await api.get('/me');
                setProfileData(data);
                setNome(data.nome || '');
                setAvatarUrl(data.avatar_url || '');
            } catch {
                toast.error('Erro ao carregar dados do perfil.');
            } finally {
                setLoadingInfo(false);
            }
        };
        fetchInfo();
    }, []);

    const handleSalvarInfo = async (e) => {
        e.preventDefault();
        setLoadingSalvarInfo(true);
        try {
            const { data } = await api.put('/me', { nome, avatar_url: avatarUrl });
            // Sincroniza oficialmente o JWT local com o Supabase Auth
            await supabase.auth.updateUser({ data: { nome: data.user_metadata.nome, avatar_url: data.user_metadata.avatar_url } });
            
            toast.success('Informações atualizadas com sucesso!');
            setProfileData(prev => ({ ...prev, nome: data.user_metadata.nome, avatar_url: data.user_metadata.avatar_url }));
            if (updateSessionMetadata) updateSessionMetadata({ nome: data.user_metadata.nome, avatar_url: data.user_metadata.avatar_url });
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao atualizar informações.');
        } finally {
            setLoadingSalvarInfo(false);
        }
    };

    const handleSalvarSenha = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return toast.error('As senhas digitadas não coincidem.');
        }
        if (password.length < 6) {
            return toast.error('A senha precisa ter pelo menos 6 caracteres.');
        }

        setLoadingSenha(true);
        try {
            await api.put('/me/password', { password });
            toast.success('Sua senha foi alterada com sucesso!');
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao alterar a senha.');
        } finally {
            setLoadingSenha(false);
        }
    };

    const hasGlobalAccess = isAdmin || profileData?.perfil === 'supervisor' || profileData?.perfil === 'Admin';
    
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("A imagem não pode ultrapassar 2MB.");
            return;
        }

        const toastId = toast.loading("Salvando nova foto...");
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Local = event.target.result;
            setAvatarUrl(base64Local); // Preview local
            
            try {
                const { data } = await api.put('/me', { nome, avatar_url: base64Local });
                // Sincroniza oficialmente
                await supabase.auth.updateUser({ data: { avatar_url: data.user_metadata.avatar_url } });
                
                setProfileData(prev => ({ ...prev, avatar_url: data.user_metadata.avatar_url }));
                setAvatarUrl(data.user_metadata.avatar_url);
                toast.success('Sua foto de perfil foi alterada!', { id: toastId });
                if (updateSessionMetadata) updateSessionMetadata({ avatar_url: data.user_metadata.avatar_url });
            } catch (error) {
                toast.error(error.response?.data?.erro || 'Erro ao salvar a foto de perfil.', { id: toastId });
            }
        };
        reader.readAsDataURL(file);
    };

    const getAvatarImageSrc = (url) => {
        if (!url) return null;
        if (url.startsWith('data:image')) return url; // Em preview local (base64)
        if (url.startsWith('/uploads')) {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            const serverUrl = apiBase.replace('/api', '');
            return `${serverUrl}${url}`;
        }
        return url; // URLs externas legadas
    };

    // Lógica para o ícone de foto de perfil (Iniciais ou Imagem)
    const renderAvatar = () => {
        let content;
        const finalUrl = getAvatarImageSrc(avatarUrl);
        
        if (finalUrl) {
            content = <img src={finalUrl} alt="Foto de Pefil" className="w-24 h-24 rounded-full object-cover shadow-md border-4 border-white" />;
        } else {
            // Retorna inicial do Nome ou do E-mail
            const initial = profileData?.nome ? profileData.nome.charAt(0).toUpperCase() : (profileData?.email || 'U').charAt(0).toUpperCase();
            content = (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center shadow-md border-4 border-white">
                    <span className="text-4xl font-black text-white">{initial}</span>
                </div>
            );
        }

        return (
            <div 
                className="relative cursor-pointer group" 
                onClick={() => fileInputRef.current?.click()}
                title="Clique para alterar a foto do perfil"
            >
                {content}
                <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Image size={24} className="text-white drop-shadow-md" />
                </div>
                <div className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-sm text-indigo-600 border border-slate-100 z-10 hidden sm:block">
                    <Crown className="w-4 h-4" />
                </div>
                {/* Input Inativo Visualmente */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp" 
                    onChange={handleAvatarChange} 
                />
            </div>
        );
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-6 pb-12 animate-in fade-in duration-500">
            {/* HERO HEADER PADRÃO SAAS */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 sm:p-8 rounded-3xl shadow-[0_15px_40px_rgba(79,70,229,0.25)] flex items-center justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-20 translate-x-20 group-hover:scale-110 transition-transform duration-700"></div>
                <div className="flex items-center space-x-6 relative z-10">
                    <div className="relative">
                        {renderAvatar()}
                    </div>
                    <div>
                        <p className="text-indigo-100 font-semibold uppercase tracking-widest text-[10px] sm:text-xs mb-1 drop-shadow-sm">Minha Conta</p>
                        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                            {profileData?.nome || 'Usuário do Sistema'}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* CARTÃO: INFORMAÇÕES PESSOAIS */}
                <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-200/60 overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><UserCircle size={20} /></div>
                        <h2 className="text-lg font-extrabold text-slate-800">Informações Pessoais</h2>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6 flex-1">
                        {loadingInfo ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-10 bg-slate-100 rounded-xl"></div>
                                <div className="h-10 bg-slate-100 rounded-xl"></div>
                                <div className="h-10 bg-slate-100 rounded-xl"></div>
                            </div>
                        ) : (
                            <form onSubmit={handleSalvarInfo} className="space-y-6 flex flex-col h-full">
                                {/* CAMPOS EDITÁVEIS */}
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            Nome de Exibição
                                        </label>
                                        <input
                                            type="text"
                                            value={nome}
                                            onChange={(e) => setNome(e.target.value)}
                                            className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-bold text-slate-700 shadow-sm transition-all focus:border-indigo-500 bg-white"
                                            placeholder="Seu nome completo ou apelido"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">P.S: Para alterar sua foto de perfil, basta clicar diretamente na imagem no topo da tela.</p>
                                </div>

                                {/* CAMPOS SOMENTE LEITURA (BLOQUEADOS) */}
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 mt-8">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                                        <Fingerprint size={14} /> Dados de Acesso Estrutural
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">E-mail Institucional</label>
                                            <div className="flex items-center gap-2 text-slate-600 bg-slate-100 p-3 rounded-lg border border-slate-200 cursor-not-allowed">
                                                <Mail size={16} className="text-slate-400" />
                                                <span className="text-sm font-medium">{profileData?.email}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nível de Perfil</label>
                                                <div className="flex items-center gap-2 text-slate-600 bg-slate-100 p-3 rounded-lg border border-slate-200 cursor-not-allowed">
                                                    <Briefcase size={16} className="text-slate-400" />
                                                    <span className="text-sm font-bold uppercase">{profileData?.perfil || getNomePerfil() || 'Visitante'}</span>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Grupo Vinculado</label>
                                                <div className="flex items-center gap-2 text-slate-600 bg-slate-100 p-3 rounded-lg border border-slate-200 cursor-not-allowed overflow-hidden">
                                                    <ShieldCheck size={16} className={hasGlobalAccess ? "text-emerald-500" : profileData?.grupo ? "text-indigo-500" : "text-slate-400"} />
                                                    <span className="text-sm font-bold truncate">
                                                        {hasGlobalAccess ? 'Visão Global' : profileData?.grupo?.nome || 'Nenhum'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-tight">Estes dados estruturais só podem ser modificados por um perfil de Supervisão.</p>
                                </div>

                                <div className="pt-4 flex-1 flex flex-col justify-end mt-auto">
                                    <button
                                        type="submit"
                                        disabled={loadingSalvarInfo}
                                        className="w-full flex justify-center items-center gap-2 p-4 bg-indigo-600 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    >
                                        {loadingSalvarInfo ? 'Salvando...' : <><Save size={18} /> Salvar Informações</>}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* CARTÃO: SEGURANÇA */}
                <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-200/60 overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-slate-100 bg-rose-50/50 flex items-center gap-3">
                        <div className="p-2 bg-rose-100 text-rose-600 rounded-xl"><Lock size={20} /></div>
                        <h2 className="text-lg font-extrabold text-slate-800">Segurança da Conta</h2>
                    </div>

                    <div className="p-6 sm:p-8 flex-1 flex flex-col">
                        <p className="text-sm text-slate-500 mb-8 font-medium">Você pode trocar sua senha a qualquer momento preenchendo os campos abaixo. Ao redefinir, certifique-se de guardá-la em segurança.</p>
                        
                        <form onSubmit={handleSalvarSenha} className="space-y-6 flex flex-col flex-1">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <KeyRound size={14} /> Nova Senha
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    minLength={6}
                                    className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/50 text-sm font-bold text-slate-700 shadow-sm transition-all focus:border-rose-500 bg-white"
                                    placeholder="Digite a nova senha..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <KeyRound size={14} /> Confirmar Nova Senha
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    minLength={6}
                                    className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/50 text-sm font-bold text-slate-700 shadow-sm transition-all focus:border-rose-500 bg-white"
                                    placeholder="Repita a senha digitada..."
                                    required
                                />
                            </div>

                            <div className="pt-4 flex-1 flex flex-col justify-end mt-auto">
                                <button
                                    type="submit"
                                    disabled={loadingSenha}
                                    className="w-full flex justify-center items-center gap-2 p-4 bg-white border-2 border-rose-600 text-rose-600 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/50 text-sm font-bold shadow-sm hover:bg-rose-600 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    {loadingSenha ? 'Alterando...' : 'Modificar Senha Segura'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Perfil;
