import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Trash2, Phone, Car, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { Vehicle, Client } from '@/types';

export default function Clients() {
  const { clients, addClient, updateClient, deleteClient } = useData();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vBrand, setVBrand] = useState('');
  const [vModel, setVModel] = useState('');
  const [vPlate, setVPlate] = useState('');
  const [vYear, setVYear] = useState('');

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editVehicles, setEditVehicles] = useState<Vehicle[]>([]);
  const [newVBrand, setNewVBrand] = useState('');
  const [newVModel, setNewVModel] = useState('');
  const [newVPlate, setNewVPlate] = useState('');
  const [newVYear, setNewVYear] = useState('');

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { toast.error('Nome e telefone são obrigatórios'); return; }
    const vehicles = vBrand.trim() ? [{ brand: vBrand, model: vModel, plate: vPlate, year: vYear }] : [];
    await addClient({ name: name.trim(), phone: phone.trim(), vehicles: vehicles as any });
    toast.success('Cliente cadastrado!');
    setName(''); setPhone(''); setVBrand(''); setVModel(''); setVPlate(''); setVYear('');
    setOpen(false);
  };

  const openEdit = (c: Client) => {
    setEditingClient(c);
    setEditName(c.name);
    setEditPhone(c.phone);
    setEditVehicles([...c.vehicles]);
    setNewVBrand(''); setNewVModel(''); setNewVPlate(''); setNewVYear('');
    setEditOpen(true);
  };

  const addVehicleToEdit = () => {
    if (!newVBrand.trim()) { toast.error('Informe a marca do veículo'); return; }
    setEditVehicles(prev => [...prev, { id: crypto.randomUUID(), client_id: editingClient?.id || '', brand: newVBrand, model: newVModel, plate: newVPlate, year: newVYear }]);
    setNewVBrand(''); setNewVModel(''); setNewVPlate(''); setNewVYear('');
  };

  const removeVehicleFromEdit = (id: string) => setEditVehicles(prev => prev.filter(v => v.id !== id));

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editName.trim() || !editPhone.trim()) { toast.error('Nome e telefone são obrigatórios'); return; }
    await updateClient({ ...editingClient, name: editName.trim(), phone: editPhone.trim(), vehicles: editVehicles });
    toast.success('Cliente atualizado!');
    setEditOpen(false);
    setEditingClient(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm">{clients.length} cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-red hover:opacity-90"><Plus className="h-4 w-4 mr-2" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-heading">Novo Cliente</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} className="bg-input border-border" /></div>
              <div className="space-y-2"><Label>WhatsApp *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="55119999..." className="bg-input border-border" /></div>
              <p className="text-xs text-muted-foreground font-medium">Veículo (opcional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Marca</Label><Input value={vBrand} onChange={e => setVBrand(e.target.value)} className="bg-input border-border" /></div>
                <div className="space-y-1"><Label className="text-xs">Modelo</Label><Input value={vModel} onChange={e => setVModel(e.target.value)} className="bg-input border-border" /></div>
                <div className="space-y-1"><Label className="text-xs">Placa</Label><Input value={vPlate} onChange={e => setVPlate(e.target.value)} className="bg-input border-border" /></div>
                <div className="space-y-1"><Label className="text-xs">Ano</Label><Input value={vYear} onChange={e => setVYear(e.target.value)} className="bg-input border-border" /></div>
              </div>
              <Button type="submit" className="w-full gradient-red hover:opacity-90">Cadastrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-heading">Editar Cliente</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2"><Label>Nome *</Label><Input value={editName} onChange={e => setEditName(e.target.value)} className="bg-input border-border" /></div>
            <div className="space-y-2"><Label>WhatsApp *</Label><Input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="bg-input border-border" /></div>
            <div className="space-y-3">
              <Label>Veículos</Label>
              {editVehicles.map(v => (
                <div key={v.id} className="flex items-center justify-between bg-accent rounded-lg px-3 py-2">
                  <span className="text-sm"><Car className="h-3 w-3 inline mr-1 text-primary" />{v.brand} {v.model} • {v.plate} • {v.year}</span>
                  <button type="button" onClick={() => removeVehicleFromEdit(v.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground font-medium">Adicionar veículo</p>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Marca" value={newVBrand} onChange={e => setNewVBrand(e.target.value)} className="bg-input border-border text-sm" />
                <Input placeholder="Modelo" value={newVModel} onChange={e => setNewVModel(e.target.value)} className="bg-input border-border text-sm" />
                <Input placeholder="Placa" value={newVPlate} onChange={e => setNewVPlate(e.target.value)} className="bg-input border-border text-sm" />
                <Input placeholder="Ano" value={newVYear} onChange={e => setNewVYear(e.target.value)} className="bg-input border-border text-sm" />
              </div>
              <Button type="button" variant="outline" onClick={addVehicleToEdit} className="border-border w-full"><Plus className="h-4 w-4 mr-1" /> Adicionar Veículo</Button>
            </div>
            <Button type="submit" className="w-full gradient-red hover:opacity-90">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-input border-border" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="card-glow rounded-xl bg-card p-5 animate-slide-in">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading font-semibold text-lg">{c.name}</h3>
                <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1"><Phone className="h-3 w-3" /> {c.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(c)} className="text-muted-foreground hover:text-primary transition-colors"><Pencil className="h-4 w-4" /></button>
                <button onClick={async () => { await deleteClient(c.id); toast.success('Cliente removido'); }} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            {c.vehicles.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                {c.vehicles.map(v => (
                  <p key={v.id} className="flex items-center gap-2 text-sm text-muted-foreground"><Car className="h-3 w-3 text-primary" />{v.brand} {v.model} • {v.plate} • {v.year}</p>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {clients.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum resultado encontrado'}
          </div>
        )}
      </div>
    </div>
  );
}
