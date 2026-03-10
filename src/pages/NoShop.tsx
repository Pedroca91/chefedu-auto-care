import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Clock } from 'lucide-react';

export default function NoShop() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center animate-slide-in">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-accent flex items-center justify-center mb-6">
          <Clock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="font-heading text-2xl font-bold mb-2">Aguardando Acesso</h1>
        <p className="text-muted-foreground mb-2">
          Sua conta <span className="text-foreground font-medium">{user?.email}</span> ainda não foi vinculada a nenhuma oficina.
        </p>
        <p className="text-muted-foreground text-sm mb-8">
          Solicite ao administrador da oficina para adicionar você como usuário.
        </p>
        <Button variant="outline" onClick={handleLogout} className="border-border">
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
      </div>
    </div>
  );
}
