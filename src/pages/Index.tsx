import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';

export default function Index() {
  const { isAuthenticated, loading: authLoading, isSuperAdmin } = useAuth();
  const { shopUsers, loading: shopLoading } = useShop();

  if (authLoading || (isAuthenticated && shopLoading)) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><span className="text-muted-foreground">Carregando...</span></div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isSuperAdmin) return <Navigate to="/admin" replace />;
  if (shopUsers.length === 0) return <Navigate to="/no-shop" replace />;
  return <Navigate to="/dashboard" replace />;
}
