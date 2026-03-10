import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Plus, Trash2, Ban, CheckCircle, Users, Store, ArrowRight, LogOut, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import type { Shop, ShopUser, ShopRole } from '@/types';
import { SHOP_ROLE_LABELS } from '@/types';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const { shops, refreshShops, setCurrentShopId } = useShop();
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false);
  const [shopName, setShopName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const [usersOpen, setUsersOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shopUsersList, setShopUsersList] = useState<(ShopUser & { email?: string })[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<ShopRole>('admin');

  const fetchShopUsers = async (shopId: string) => {
    const { data } = await (supabase.from as any)('shop_users').select('*').eq('shop_id', shopId);
    setShopUsersList((data || []) as ShopUser[]);
  };

  const handleCreate = async () => {
    if (!shopName.trim()) { toast.error('Nome da oficina é obrigatório'); return; }
    const { data, error } = await (supabase.from as any)('shops').insert({ name: shopName.trim() }).select().single();
    if (error) { toast.error('Erro ao criar oficina'); return; }
    const shop = data as Shop;

    if (adminEmail.trim()) {
      const { data: userId } = await supabase.rpc('get_user_id_by_email' as any, { _email: adminEmail.trim() });
      if (userId) {
        await (supabase.from as any)('shop_users').insert({ shop_id: shop.id, user_id: userId, role: 'admin' });
      } else {
        toast.warning('Usuário admin não encontrado. Cadastre-o primeiro.');
      }
    }

    toast.success('Oficina criada!');
    setShopName(''); setAdminEmail('');
    setCreateOpen(false);
    await refreshShops();
  };

  const handleToggleActive = async (shop: Shop) => {
    await (supabase.from as any)('shops').update({ active: !shop.active }).eq('id', shop.id);
    toast.success(shop.active ? 'Oficina bloqueada' : 'Oficina desbloqueada');
    await refreshShops();
  };

  const handleDelete = async (shopId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta oficina? Todos os dados serão perdidos.')) return;
    await (supabase.from as any)('shops').delete().eq('id', shopId);
    toast.success('Oficina excluída');
    await refreshShops();
  };

  const handleAddUser = async () => {
    if (!selectedShop || !newUserEmail.trim()) return;
    const { data: userId } = await supabase.rpc('get_user_id_by_email' as any, { _email: newUserEmail.trim() });
    if (!userId) { toast.error('Usuário não encontrado. Ele precisa criar uma conta primeiro.'); return; }
    const { error } = await (supabase.from as any)('shop_users').insert({ shop_id: selectedShop.id, user_id: userId, role: newUserRole });
    if (error) { toast.error('Erro ao adicionar usuário (pode já estar vinculado)'); return; }
    toast.success('Usuário adicionado!');
    setNewUserEmail('');
    await fetchShopUsers(selectedShop.id);
  };

  const handleRemoveUser = async (suId: string) => {
    await (supabase.from as any)('shop_users').delete().eq('id', suId);
    toast.success('Usuário removido');
    if (selectedShop) await fetchShopUsers(selectedShop.id);
  };

  const openUsers = async (shop: Shop) => {
    setSelectedShop(shop);
    await fetchShopUsers(shop.id);
    setUsersOpen(true);
  };

  const enterShop = (shopId: string) => {
    setCurrentShopId(shopId);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const activeShops = shops.filter(s => s.active);
  const blockedShops = shops.filter(s => !s.active);

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-heading text-lg font-bold text-primary">Super Admin</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
          <LogOut className="h-4 w-4 mr-1" /> Sair
        </Button>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground text-sm">{shops.length} oficinas cadastradas</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-red hover:opacity-90"><Plus className="h-4 w-4 mr-2" /> Nova Oficina</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle className="font-heading">Criar Oficina</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Oficina *</Label>
                  <Input value={shopName} onChange={e => setShopName(e.target.value)} className="bg-input border-border" placeholder="Ex: Auto Center Silva" />
                </div>
                <div className="space-y-2">
                  <Label>E-mail do Administrador (opcional)</Label>
                  <Input value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="bg-input border-border" placeholder="admin@email.com" />
                  <p className="text-xs text-muted-foreground">O usuário precisa ter conta cadastrada</p>
                </div>
                <Button onClick={handleCreate} className="w-full gradient-red hover:opacity-90">Criar Oficina</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-glow rounded-xl bg-card p-5">
            <p className="text-sm text-muted-foreground">Total Oficinas</p>
            <p className="text-3xl font-heading font-bold mt-1">{shops.length}</p>
          </div>
          <div className="card-glow rounded-xl bg-card p-5">
            <p className="text-sm text-muted-foreground">Ativas</p>
            <p className="text-3xl font-heading font-bold mt-1 text-success">{activeShops.length}</p>
          </div>
          <div className="card-glow rounded-xl bg-card p-5">
            <p className="text-sm text-muted-foreground">Bloqueadas</p>
            <p className="text-3xl font-heading font-bold mt-1 text-destructive">{blockedShops.length}</p>
          </div>
        </div>

        <div className="space-y-3">
          {shops.map(shop => (
            <div key={shop.id} className={`card-glow rounded-xl bg-card p-5 animate-slide-in ${!shop.active ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg gradient-red flex items-center justify-center font-heading text-lg font-bold text-primary-foreground">
                    {shop.name[0]}
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold">{shop.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {shop.active ? '✅ Ativa' : '🚫 Bloqueada'}
                      {shop.phone && ` • ${shop.phone}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => openUsers(shop)} className="border-border">
                    <Users className="h-3 w-3 mr-1" /> Usuários
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => enterShop(shop.id)} className="border-primary text-primary">
                    <ArrowRight className="h-3 w-3 mr-1" /> Entrar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggleActive(shop)} className={shop.active ? 'border-destructive text-destructive' : 'border-success text-success'}>
                    {shop.active ? <><Ban className="h-3 w-3 mr-1" /> Bloquear</> : <><CheckCircle className="h-3 w-3 mr-1" /> Desbloquear</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(shop.id)} className="border-destructive text-destructive hover:bg-destructive/15">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {shops.length === 0 && <div className="text-center py-12 text-muted-foreground">Nenhuma oficina cadastrada. Crie a primeira!</div>}
        </div>
      </div>

      <Dialog open={usersOpen} onOpenChange={setUsersOpen}>
        <DialogContent className="bg-card border-border max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-heading">Usuários - {selectedShop?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {shopUsersList.map(su => (
                <div key={su.id} className="flex items-center justify-between p-3 rounded-lg bg-accent">
                  <div>
                    <p className="text-sm font-medium">ID: {su.user_id.slice(0, 8)}...</p>
                    <p className="text-xs text-muted-foreground">{SHOP_ROLE_LABELS[su.role]}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveUser(su.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {shopUsersList.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário vinculado</p>}
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-sm font-medium">Adicionar Usuário</p>
              <Input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="email@usuario.com" className="bg-input border-border" />
              <Select value={newUserRole} onValueChange={v => setNewUserRole(v as ShopRole)}>
                <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="mechanic">Mecânico</SelectItem>
                  <SelectItem value="financial">Financeiro</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddUser} className="w-full gradient-red hover:opacity-90">
                <UserPlus className="h-4 w-4 mr-2" /> Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
