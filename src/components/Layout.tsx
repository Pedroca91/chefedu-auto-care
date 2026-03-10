import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { LayoutDashboard, Users, FileText, Wrench, DollarSign, Calendar, Car, LogOut, Menu, X, Settings, UserCog, Shield } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

export default function Layout() {
  const { logout, isSuperAdmin } = useAuth();
  const { currentShop, shops, currentShopId, setCurrentShopId, userRole, shopUsers } = useShop();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = isSuperAdmin || userRole === 'admin';
  const isFinancial = isSuperAdmin || userRole === 'admin' || userRole === 'financial';

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { to: '/clients', icon: Users, label: 'Clientes', show: isAdmin },
    { to: '/quotes', icon: FileText, label: 'Orçamentos', show: isAdmin },
    { to: '/services', icon: Wrench, label: 'Serviços', show: true },
    { to: '/financial', icon: DollarSign, label: 'Financeiro', show: isFinancial },
    { to: '/agenda', icon: Calendar, label: 'Agenda', show: true },
    { to: '/vehicle-history', icon: Car, label: 'Histórico Veículos', show: true },
    { to: '/shop-settings', icon: Settings, label: 'Configurações', show: isAdmin },
    { to: '/shop-users', icon: UserCog, label: 'Usuários', show: isAdmin },
  ].filter(i => i.show);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Shops the user can switch between
  const accessibleShops = isSuperAdmin ? shops : shops.filter(s => shopUsers.some(su => su.shop_id === s.id));

  const sidebarContent = (
    <>
      <div className="px-6 py-6">
        <div className="flex items-center gap-3 mb-3">
          {currentShop?.logo_url ? (
            <img src={currentShop.logo_url} alt="Logo" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-lg gradient-red flex items-center justify-center font-heading text-xl font-bold text-primary-foreground">
              {currentShop?.name?.[0] || 'O'}
            </div>
          )}
          <span className="font-heading text-lg font-bold text-primary truncate">{currentShop?.name || 'Oficina'}</span>
        </div>
        {accessibleShops.length > 1 && (
          <Select value={currentShopId || ''} onValueChange={setCurrentShopId}>
            <SelectTrigger className="bg-input border-border text-xs h-8">
              <SelectValue placeholder="Selecionar oficina" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {accessibleShops.map(s => (
                <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {isSuperAdmin && (
          <NavLink to="/admin" onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-primary/15 text-primary neon-glow' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}>
            <Shield className="h-5 w-5" /> Super Admin
          </NavLink>
        )}
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-primary/15 text-primary neon-glow' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}>
            <Icon className="h-5 w-5" /> {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-6">
        <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-accent transition-all">
          <LogOut className="h-5 w-5" /> Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar">{sidebarContent}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 flex w-64 h-full flex-col bg-sidebar border-r border-border">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-muted-foreground"><X className="h-5 w-5" /></button>
            {sidebarContent}
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center px-4 md:px-6 bg-card">
          <button onClick={() => setMobileOpen(true)} className="md:hidden mr-3 text-muted-foreground"><Menu className="h-6 w-6" /></button>
          <span className="md:hidden font-heading text-lg font-bold text-primary">{currentShop?.name || 'Oficina'}</span>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
