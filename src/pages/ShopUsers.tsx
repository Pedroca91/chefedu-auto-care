import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserCog, UserPlus, Trash2 } from 'lucide-react';
import type { ShopUser, ShopRole } from '@/types';
import { SHOP_ROLE_LABELS } from '@/types';

export default function ShopUsers() {
  const { currentShop, currentShopId } = useShop();
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<ShopUser[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<ShopRole>('mechanic');

  const fetchUsers = useCallback(async () => {
    if (!currentShopId) return;
    const { data } = await (supabase.from as any)('shop_users').select('*').eq('shop_id', currentShopId);
    setUsers((data || []) as ShopUser[]);
  }, [currentShopId]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAdd = async () => {
    if (!currentShopId || !newEmail.trim()) { toast.error('Informe o e-mail'); return; }
    const { data: userId } = await supabase.rpc('get_user_id_by_email' as any, { _email: newEmail.trim() });
    if (!userId) { toast.error('Usuário não encontrado. Ele precisa criar uma conta primeiro.'); return; }
    const { error } = await (supabase.from as any)('shop_users').insert({ shop_id: currentShopId, user_id: userId, role: newRole });
    if (error) { toast.error('Erro ao adicionar (usuário pode já estar vinculado)'); return; }
    toast.success('Usuário adicionado!');
    setNewEmail('');
    await fetchUsers();
  };

  const handleRemove = async (id: string) => {
    await (supabase.from as any)('shop_users').delete().eq('id', id);
    toast.success('Usuário removido');
    await fetchUsers();
  };

  const handleRoleChange = async (id: string, role: ShopRole) => {
    await (supabase.from as any)('shop_users').update({ role }).eq('id', id);
    toast.success('Permissão atualizada');
    await fetchUsers();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2"><UserCog className="h-8 w-8 text-primary" /> Usuários</h1>
        <p className="text-muted-foreground text-sm">Gerencie os usuários de {currentShop?.name}</p>
      </div>

      <div className="card-glow rounded-xl bg-card p-6 space-y-4">
        <h3 className="font-heading font-semibold">Adicionar Usuário</h3>
        <div className="flex gap-3 flex-wrap">
          <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@usuario.com" className="bg-input border-border flex-1 min-w-[200px]" />
          <Select value={newRole} onValueChange={v => setNewRole(v as ShopRole)}>
            <SelectTrigger className="bg-input border-border w-40"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="mechanic">Mecânico</SelectItem>
              <SelectItem value="financial">Financeiro</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} className="gradient-red hover:opacity-90"><UserPlus className="h-4 w-4 mr-1" /> Adicionar</Button>
        </div>
        <p className="text-xs text-muted-foreground">O usuário precisa ter uma conta cadastrada no sistema</p>
      </div>

      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className="card-glow rounded-xl bg-card p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">ID: {u.user_id.slice(0, 12)}...</p>
              <p className="text-xs text-muted-foreground">{SHOP_ROLE_LABELS[u.role]} • Desde {new Date(u.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={u.role} onValueChange={v => handleRoleChange(u.id, v as ShopRole)}>
                <SelectTrigger className="bg-input border-border w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="mechanic">Mecânico</SelectItem>
                  <SelectItem value="financial">Financeiro</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" onClick={() => handleRemove(u.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {users.length === 0 && <div className="text-center py-8 text-muted-foreground">Nenhum usuário vinculado a esta oficina</div>}
      </div>
    </div>
  );
}
