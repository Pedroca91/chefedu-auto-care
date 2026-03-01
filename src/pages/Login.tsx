import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';

export default function Login() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(user, pass)) {
      navigate('/dashboard');
    } else {
      toast.error('Usuário ou senha inválidos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-slide-in">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 rounded-2xl gradient-red flex items-center justify-center mb-4 neon-glow">
            <span className="font-heading text-3xl font-bold text-primary-foreground">C</span>
          </div>
          <h1 className="font-heading text-4xl font-bold neon-text text-primary">CHEFEDU</h1>
          <p className="text-muted-foreground mt-1 text-sm">Sistema de Gestão Mecânica</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 card-glow rounded-xl bg-card p-6">
          <div className="space-y-2">
            <Label htmlFor="user">Usuário</Label>
            <Input id="user" value={user} onChange={e => setUser(e.target.value)} placeholder="admin" className="bg-input border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pass">Senha</Label>
            <Input id="pass" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" className="bg-input border-border" />
          </div>
          <Button type="submit" className="w-full gradient-red hover:opacity-90 transition-opacity">
            <KeyRound className="h-4 w-4 mr-2" />
            Entrar
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          admin / chefedu123
        </p>
      </div>
    </div>
  );
}
