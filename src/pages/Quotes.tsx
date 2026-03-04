import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Send, Search, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';
import type { QuotePart, QuoteStatus, Quote } from '@/types';

export default function Quotes() {
  const { clients, quotes, addQuote, updateQuote, updateQuoteStatus, getClient, addService } = useData();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [clientId, setClientId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [parts, setParts] = useState<QuotePart[]>([]);
  const [laborCost, setLaborCost] = useState('');
  const [partsMarkup, setPartsMarkup] = useState('');
  const [observations, setObservations] = useState('');
  const [partName, setPartName] = useState('');
  const [partPrice, setPartPrice] = useState('');

  const [editParts, setEditParts] = useState<QuotePart[]>([]);
  const [editLaborCost, setEditLaborCost] = useState('');
  const [editPartsMarkup, setEditPartsMarkup] = useState('');
  const [editObservations, setEditObservations] = useState('');
  const [editPartName, setEditPartName] = useState('');
  const [editPartPrice, setEditPartPrice] = useState('');

  const selectedClient = clients.find(c => c.id === clientId);

  const addPart = () => {
    if (!partName.trim() || !partPrice) { toast.error('Preencha nome e valor da peça'); return; }
    setParts(prev => [...prev, { id: crypto.randomUUID(), name: partName.trim(), price: parseFloat(partPrice) }]);
    setPartName(''); setPartPrice('');
  };

  const addEditPart = () => {
    if (!editPartName.trim() || !editPartPrice) { toast.error('Preencha nome e valor da peça'); return; }
    setEditParts(prev => [...prev, { id: crypto.randomUUID(), name: editPartName.trim(), price: parseFloat(editPartPrice) }]);
    setEditPartName(''); setEditPartPrice('');
  };

  const removePart = (id: string) => setParts(prev => prev.filter(p => p.id !== id));
  const removeEditPart = (id: string) => setEditParts(prev => prev.filter(p => p.id !== id));

  const calcTotal = (p: QuotePart[], labor: string, markup: string) => {
    const partsSum = p.reduce((s, x) => s + x.price, 0);
    const markedUp = partsSum * (1 + (parseFloat(markup) || 0) / 100);
    return markedUp + (parseFloat(labor) || 0);
  };

  const total = calcTotal(parts, laborCost, partsMarkup);
  const editTotal = calcTotal(editParts, editLaborCost, editPartsMarkup);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { toast.error('Selecione um cliente'); return; }
    if (parts.length === 0) { toast.error('Adicione pelo menos uma peça'); return; }
    await addQuote({
      client_id: clientId, vehicle_id: vehicleId || null,
      parts: parts.map(p => ({ name: p.name, price: p.price })),
      labor_cost: parseFloat(laborCost) || 0, parts_markup: parseFloat(partsMarkup) || 0,
      observations, status: 'pending',
    });
    toast.success('Orçamento criado!');
    setClientId(''); setVehicleId(''); setParts([]); setLaborCost(''); setPartsMarkup(''); setObservations('');
    setOpen(false);
  };

  const openEdit = (q: Quote) => {
    if (q.status === 'completed') { toast.error('Orçamento finalizado não pode ser editado'); return; }
    setEditingQuote(q);
    setEditParts([...q.parts]);
    setEditLaborCost(q.labor_cost.toString());
    setEditPartsMarkup((q.parts_markup || 0).toString());
    setEditObservations(q.observations);
    setEditPartName(''); setEditPartPrice('');
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote) return;
    if (editParts.length === 0) { toast.error('Adicione pelo menos uma peça'); return; }
    await updateQuote({
      ...editingQuote,
      parts: editParts,
      labor_cost: parseFloat(editLaborCost) || 0,
      parts_markup: parseFloat(editPartsMarkup) || 0,
      observations: editObservations,
    });
    toast.success('Orçamento atualizado!');
    setEditOpen(false);
    setEditingQuote(null);
  };

  const sendWhatsApp = (quoteId: string) => {
    const q = quotes.find(x => x.id === quoteId)!;
    const client = getClient(q.client_id);
    if (!client) return;
    const markup = 1 + (q.parts_markup || 0) / 100;
    const partsText = q.parts.map(p => `• ${p.name}: R$ ${(p.price * markup).toFixed(2)}`).join('\n');
    const msg = encodeURIComponent(
      `🔧 *CHEFEDU - Orçamento*\n\nOlá ${client.name}!\n\nSegue seu orçamento:\n\n${partsText}\n\n🛠 Mão de obra: R$ ${q.labor_cost.toFixed(2)}\n💰 *TOTAL: R$ ${q.total.toFixed(2)}*\n\n${q.observations ? `📝 Obs: ${q.observations}\n\n` : ''}Responda *SIM* para aprovar.`
    );
    window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
    toast.success('Abrindo WhatsApp...');
  };

  const handleStatusChange = async (id: string, status: QuoteStatus) => {
    await updateQuoteStatus(id, status);
    if (status === 'approved') {
      const q = quotes.find(x => x.id === id)!;
      await addService(id, q.client_id, q.vehicle_id);
      toast.success('Orçamento aprovado e serviço criado!');
    } else {
      toast.success(`Status atualizado para ${STATUS_LABELS[status]}`);
    }
  };

  const filtered = quotes.filter(q => {
    const client = getClient(q.client_id);
    return !search || (client?.name.toLowerCase().includes(search.toLowerCase()));
  });

  const partsForm = (
    currentParts: QuotePart[], addFn: () => void, removeFn: (id: string) => void,
    pName: string, setPName: (v: string) => void, pPrice: string, setPPrice: (v: string) => void
  ) => (
    <div className="space-y-3">
      <Label>Peças</Label>
      <div className="flex gap-2">
        <Input placeholder="Nome da peça" value={pName} onChange={e => setPName(e.target.value)} className="bg-input border-border flex-1" />
        <Input type="number" placeholder="Valor" value={pPrice} onChange={e => setPPrice(e.target.value)} className="bg-input border-border w-28" step="0.01" />
        <Button type="button" variant="outline" onClick={addFn} className="border-border"><Plus className="h-4 w-4" /></Button>
      </div>
      {currentParts.map(p => (
        <div key={p.id} className="flex items-center justify-between bg-accent rounded-lg px-3 py-2">
          <span className="text-sm">{p.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">R$ {p.price.toFixed(2)}</span>
            <button type="button" onClick={() => removeFn(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Orçamentos</h1>
          <p className="text-muted-foreground text-sm">{quotes.length} orçamentos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-red hover:opacity-90" disabled={clients.length === 0}><Plus className="h-4 w-4 mr-2" /> Novo Orçamento</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-h-[90vh] overflow-auto max-w-lg">
            <DialogHeader><DialogTitle className="font-heading">Novo Orçamento</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={clientId} onValueChange={v => { setClientId(v); setVehicleId(''); }}>
                  <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {selectedClient && selectedClient.vehicles.length > 0 && (
                <div className="space-y-2">
                  <Label>Veículo</Label>
                  <Select value={vehicleId} onValueChange={setVehicleId}>
                    <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {selectedClient.vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} - {v.plate}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {partsForm(parts, addPart, removePart, partName, setPartName, partPrice, setPartPrice)}
              <div className="space-y-2">
                <Label>Margem sobre peças (%)</Label>
                <Input type="number" value={partsMarkup} onChange={e => setPartsMarkup(e.target.value)} className="bg-input border-border" step="0.1" placeholder="Ex: 30" />
                <p className="text-xs text-muted-foreground">Percentual adicionado ao custo das peças (não visível ao cliente)</p>
              </div>
              <div className="space-y-2">
                <Label>Mão de Obra (R$)</Label>
                <Input type="number" value={laborCost} onChange={e => setLaborCost(e.target.value)} className="bg-input border-border" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={observations} onChange={e => setObservations(e.target.value)} className="bg-input border-border" rows={3} />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-lg font-heading font-bold">Total:</span>
                <span className="text-2xl font-heading font-bold text-primary">R$ {total.toFixed(2)}</span>
              </div>
              <Button type="submit" className="w-full gradient-red hover:opacity-90">Criar Orçamento</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-auto max-w-lg">
          <DialogHeader><DialogTitle className="font-heading">Editar Orçamento</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            {partsForm(editParts, addEditPart, removeEditPart, editPartName, setEditPartName, editPartPrice, setEditPartPrice)}
            <div className="space-y-2">
              <Label>Margem sobre peças (%)</Label>
              <Input type="number" value={editPartsMarkup} onChange={e => setEditPartsMarkup(e.target.value)} className="bg-input border-border" step="0.1" />
            </div>
            <div className="space-y-2">
              <Label>Mão de Obra (R$)</Label>
              <Input type="number" value={editLaborCost} onChange={e => setEditLaborCost(e.target.value)} className="bg-input border-border" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={editObservations} onChange={e => setEditObservations(e.target.value)} className="bg-input border-border" rows={3} />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-lg font-heading font-bold">Total:</span>
              <span className="text-2xl font-heading font-bold text-primary">R$ {editTotal.toFixed(2)}</span>
            </div>
            <Button type="submit" className="w-full gradient-red hover:opacity-90">Salvar Alterações</Button>
          </form>
        </DialogContent>
      </Dialog>

      {clients.length === 0 && <div className="text-center py-12 text-muted-foreground">Cadastre clientes primeiro para criar orçamentos.</div>}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-input border-border" />
      </div>

      <div className="space-y-3">
        {filtered.map(q => {
          const client = getClient(q.client_id);
          const expanded = expandedId === q.id;
          const markup = 1 + (q.parts_markup || 0) / 100;
          return (
            <div key={q.id} className="card-glow rounded-xl bg-card overflow-hidden animate-slide-in">
              <button onClick={() => setExpandedId(expanded ? null : q.id)} className="w-full flex items-center justify-between p-5 text-left">
                <div>
                  <p className="font-heading font-semibold">{client?.name || 'Cliente'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading font-bold">R$ {q.total.toFixed(2)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[q.status]}`}>{STATUS_LABELS[q.status]}</span>
                  {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>
              {expanded && (
                <div className="px-5 pb-5 border-t border-border pt-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Peças</p>
                    {q.parts.map(p => (
                      <div key={p.id} className="flex justify-between text-sm py-1">
                        <span>{p.name}</span>
                        <span>R$ {(p.price * markup).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mão de obra</span>
                    <span>R$ {q.labor_cost.toFixed(2)}</span>
                  </div>
                  {q.observations && <p className="text-sm text-muted-foreground">📝 {q.observations}</p>}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {q.status !== 'completed' && (
                      <Button size="sm" variant="outline" onClick={() => openEdit(q)} className="border-border"><Pencil className="h-3 w-3 mr-1" /> Editar</Button>
                    )}
                    <Button size="sm" onClick={() => sendWhatsApp(q.id)} className="bg-success hover:bg-success/90 text-success-foreground"><Send className="h-3 w-3 mr-1" /> WhatsApp</Button>
                    {q.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(q.id, 'approved')} className="border-success text-success hover:bg-success/15">Aprovar</Button>
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(q.id, 'rejected')} className="border-destructive text-destructive hover:bg-destructive/15">Recusar</Button>
                      </>
                    )}
                    {q.status === 'approved' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(q.id, 'in_progress')} className="border-primary text-primary hover:bg-primary/15">Iniciar Serviço</Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && quotes.length > 0 && <div className="text-center py-12 text-muted-foreground">Nenhum resultado encontrado</div>}
      </div>
    </div>
  );
}
