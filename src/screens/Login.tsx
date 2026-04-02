import React, { useState } from 'react';
import { auth, loginWithGoogle, logout, loginWithEmail, registerWithEmail, saveUserProfile } from '../services/supabase';
import { LogIn, GraduationCap, Mail, Lock, UserPlus, User, Hash, Camera, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'email' | 'register'>('email');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [matricula, setMatricula] = useState('');
  const [telefone, setTelefone] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  const validateEmail = (email: string) => {
    return email.endsWith('@firjan.com.br') || email.endsWith('@docente.firjan.senai.br');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64
        setError('A foto deve ter no máximo 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Acesso restrito. Por favor, utilize um e-mail corporativo @firjan.com.br');
      return;
    }

    if (mode === 'register' && password.length < 8) {
      setError('A senha deve ter no mínimo 8 dígitos');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        const { data, error } = await registerWithEmail(email, password);
        if (error) throw error;
        if (data.user) {
          await saveUserProfile(data.user.id, {
            name,
            matricula,
            telefone,
            photoURL,
            email
          });
          setRegistrationSuccess(true);
          // Don't auto-login if they want to see the success screen
          await logout();
        }
      } else {
        const { error } = await loginWithEmail(email, password);
        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      let message = 'Erro ao autenticar';
      if (error.message?.includes('Invalid login credentials')) {
        message = 'E-mail ou senha incorretos';
      } else if (error.message?.includes('User already registered')) {
        message = 'Este e-mail já está em uso';
      } else if (error.message) {
        message = `Erro: ${error.message}`;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-bg p-4 overflow-hidden relative">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-purple/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-green/20 blur-[100px] rounded-full" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 text-center w-full max-w-md bg-dark-card p-8 rounded-2xl border border-neon-green shadow-[0_0_20px_rgba(255,51,51,0.2)]"
        >
          <div className="w-20 h-20 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserPlus className="w-10 h-10 text-neon-green" />
          </div>
          <h2 className="text-3xl font-black mb-4 text-white">Conta Criada com Sucesso!</h2>
          <p className="text-gray-400 mb-8">
            Seu perfil de professor foi registrado. Agora você já pode acessar o sistema para gerenciar seus projetos.
          </p>
          <button 
            onClick={() => {
              setRegistrationSuccess(false);
              setMode('email');
            }}
            className="neon-button-green w-full flex items-center justify-center gap-3 text-lg py-4"
          >
            <LogIn className="w-6 h-6" />
            Fazer Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-bg p-4 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-purple/20 blur-[100px] rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-green/20 blur-[100px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 text-center w-full max-w-md px-4 sm:px-0"
      >
        <div className="flex flex-col items-center justify-center mb-6 gap-3 sm:gap-4">
          <div className="bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded flex items-center justify-center">
            <span className="text-[#005099] font-black text-3xl sm:text-4xl tracking-tighter leading-none">SENAI</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-center">
            Project Hub Educacional <span className="text-neon-purple block sm:inline mt-1 sm:mt-0">Senai - VR</span>
          </h1>
        </div>
        
        <p className="text-lg sm:text-xl text-gray-400 mb-6 sm:mb-8 mx-auto">
          Acesso restrito para <span className="text-neon-purple font-bold">Professores Orientadores</span>.
        </p>

        <div className="bg-dark-card p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl w-full">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-white">
            {mode === 'register' ? 'Cadastro de Professor' : 'Login Corporativo'}
          </h2>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-6 text-sm font-bold"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="text"
                    placeholder="Nome Completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 sm:py-4 focus:outline-none focus:border-neon-purple transition-all text-sm sm:text-base"
                  />
                </div>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="text"
                    placeholder="Matrícula"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 sm:py-4 focus:outline-none focus:border-neon-purple transition-all text-sm sm:text-base"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="tel"
                    placeholder="Telefone/WhatsApp (Ex: 24999999999)"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 sm:py-4 focus:outline-none focus:border-neon-purple transition-all text-sm sm:text-base"
                  />
                </div>
                <div className="relative">
                  <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <div className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 sm:py-4 flex items-center justify-between text-sm sm:text-base">
                    <span className="text-gray-500 text-sm truncate">
                      {photoURL ? 'Foto selecionada' : 'Foto de Perfil'}
                    </span>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {photoURL && (
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-neon-purple">
                        <img src={photoURL} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="email"
                placeholder="E-mail @firjan.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 sm:py-4 focus:outline-none focus:border-neon-purple transition-all text-sm sm:text-base"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 sm:py-4 focus:outline-none focus:border-neon-purple transition-all text-sm sm:text-base"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="neon-button-green w-full flex items-center justify-center gap-3 text-base sm:text-lg py-3 sm:py-4 mt-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
              ) : (
                <>
                  {mode === 'register' ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
                  {mode === 'register' ? 'Criar Conta' : 'Entrar'}
                </>
              )}
            </button>
            <button 
              type="button"
              onClick={() => setMode(mode === 'email' ? 'register' : 'email')}
              className="text-gray-500 text-sm hover:text-neon-purple transition-colors"
            >
              {mode === 'email' ? 'Não tem conta? Cadastre-se como Professor' : 'Já tem conta? Faça Login'}
            </button>
          </form>
        </div>

        <div className="mt-16 flex justify-center text-gray-500 text-sm uppercase tracking-widest font-bold">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white" />
            By Márcio Vinícius
          </div>
        </div>
      </motion.div>
    </div>
  );
}
