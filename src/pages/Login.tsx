import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { KeyRound, UserPlus } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) { navigate('/'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !pass.trim()) { toast.error('Preencha todos os campos'); return; }
    setLoading(true);
    if (isSignup) {
      const res = await signup(email, pass);
      if (res.success) {
        toast.success('Conta criada! Entrando...');
        const ok = await login(email, pass);
        if (ok) navigate('/');
      } else {
        toast.error(res.error || 'Erro ao criar conta');
      }
    } else {
      const ok = await login(email, pass);
      if (ok) {
        navigate('/');
      } else {
        toast.error('E-mail ou senha inválidos');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-slide-in">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 rounded-2xl gradient-red flex items-center justify-center mb-4 neon-glow">
            <span className="font-heading text-3xl font-bold text-primary-foreground">⚙</span>
          </div>
          <h1 className="font-heading text-3xl font-bold neon-text text-primary">Sistema de Gestão</h1>
          <p className="text-muted-foreground mt-1 text-sm">para Oficinas Mecânicas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 card-glow rounded-xl bg-card p-6">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="bg-input border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pass">Senha</Label>
            <Input id="pass" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" className="bg-input border-border" />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-red hover:opacity-90 transition-opacity">
            {isSignup ? <UserPlus className="h-4 w-4 mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
            {loading ? 'Aguarde...' : isSignup ? 'Criar Conta' : 'Entrar'}
          </Button>
          <button type="button" onClick={() => setIsSignup(!isSignup)} className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors">
            {isSignup ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
