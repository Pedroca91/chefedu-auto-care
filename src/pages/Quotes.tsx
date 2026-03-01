import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Send, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';
import type { QuotePart, QuoteStatus } from '@/types';

export default function Quotes() {
  const { clients, quotes, addQuote, updateQuoteStatus, getClient, addService } = useData();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [clientId, setClientId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [parts, setParts] = useState<QuotePart[]>([]);
  const [laborCost, setLaborCost] = useState('');
  const [observations, setObservations] = useState('');
  const [partName, setPartName] = useState('');
  const [partPrice, setPartPrice] = useState('');

  const selectedClient = clients.find(c => c.id === clientId);

  const addPart = () => {
    if (!partName.trim() || !partPrice) { toast.error('Preencha nome e valor da peça'); return; }
    setParts(prev => [...prev, { id: crypto.randomUUID(), name: partName.trim(), price: parseFloat(partPrice) }]);
    setPartName(''); setPartPrice('');
  };

  const removePart = (id: string) => setParts(prev => prev.filter(p => p.id !== id));

  const total = parts.reduce((s, p) => s + p.price, 0) + (parseFloat(laborCost) || 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { toast.error('Selecione um cliente'); return; }
    if (parts.length === 0) { toast.error('Adicione pelo menos uma peça'); return; }
    addQuote({ clientId, vehicleId, parts, laborCost: parseFloat(laborCost) || 0, observations, status: 'pending' });
    toast.success('Orçamento criado!');
    setClientId(''); setVehicleId(''); setParts([]); setLaborCost(''); setObservations('');
    setOpen(false);
  };

  const sendWhatsApp = (quoteId: string) => {
    const q = quotes.find(x => x.id === quoteId)!;
    const client = getClient(q.clientId);
    if (!client) return;

    const partsText = q.parts.map(p => `• ${p.name}: R$ ${p.price.toFixed(2)}`).join('\n');
    const msg = encodeURIComponent(
      `🔧 *CHEFEDU - Orçamento*\n\nOlá ${client.name}!\n\nSegue seu orçamento:\n\n${partsText}\n\n🛠 Mão de obra: R$ ${q.laborCost.toFixed(2)}\n💰 *TOTAL: R$ ${q.total.toFixed(2)}*\n\n${q.observations ? `📝 Obs: ${q.observations}\n\n` : ''}Responda *SIM* para aprovar.`
    );
    window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
    toast.success('Abrindo WhatsApp...');
  };

  const handleStatusChange = (id: string, status: QuoteStatus) => {
    updateQuoteStatus(id, status);
    if (status === 'approved') {
      const q = quotes.find(x => x.id === id)!;
      addService(id, q.clientId);
      toast.success('Orçamento aprovado e serviço criado!');
    } else {
      toast.success(`Status atualizado para ${STATUS_LABELS[status]}`);
    }
  };

  const filtered = quotes.filter(q => {
    const client = getClient(q.clientId);
    return !search || (client?.name.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Orçamentos</h1>
          <p className="text-muted-foreground text-sm">{quotes.length} orçamentos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-red hover:opacity-90" disabled={clients.length === 0}>
              <Plus className="h-4 w-4 mr-2" /> Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-h-[90vh] overflow-auto max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Novo Orçamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={clientId} onValueChange={v => { setClientId(v); setVehicleId(''); }}>
                  <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {selectedClient && selectedClient.vehicles.length > 0 && (
                <div className="space-y-2">
                  <Label>Veículo</Label>
                  <Select value={vehicleId} onValueChange={setVehicleId}>
                    <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {selectedClient.vehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} - {v.plate}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-3">
                <Label>Peças</Label>
                <div className="flex gap-2">
                  <Input placeholder="Nome da peça" value={partName} onChange={e => setPartName(e.target.value)} className="bg-input border-border flex-1" />
                  <Input type="number" placeholder="Valor" value={partPrice} onChange={e => setPartPrice(e.target.value)} className="bg-input border-border w-28" step="0.01" />
                  <Button type="button" variant="outline" onClick={addPart} className="border-border"><Plus className="h-4 w-4" /></Button>
                </div>
                {parts.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-accent rounded-lg px-3 py-2">
                    <span className="text-sm">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">R$ {p.price.toFixed(2)}</span>
                      <button type="button" onClick={() => removePart(p.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
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

      {clients.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Cadastre clientes primeiro para criar orçamentos.
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-input border-border" />
      </div>

      <div className="space-y-3">
        {filtered.slice().reverse().map(q => {
          const client = getClient(q.clientId);
          const expanded = expandedId === q.id;
          return (
            <div key={q.id} className="card-glow rounded-xl bg-card overflow-hidden animate-slide-in">
              <button
                onClick={() => setExpandedId(expanded ? null : q.id)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div>
                  <p className="font-heading font-semibold">{client?.name || 'Cliente'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading font-bold">R$ {q.total.toFixed(2)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[q.status]}`}>
                    {STATUS_LABELS[q.status]}
                  </span>
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
                        <span>R$ {p.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mão de obra</span>
                    <span>R$ {q.laborCost.toFixed(2)}</span>
                  </div>
                  {q.observations && <p className="text-sm text-muted-foreground">📝 {q.observations}</p>}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" onClick={() => sendWhatsApp(q.id)} className="bg-success hover:bg-success/90 text-success-foreground">
                      <Send className="h-3 w-3 mr-1" /> WhatsApp
                    </Button>
                    {q.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(q.id, 'approved')} className="border-success text-success hover:bg-success/15">Aprovar</Button>
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(q.id, 'rejected')} className="border-destructive text-destructive hover:bg-destructive/15">Recusar</Button>
                      </>
                    )}
                    {q.status === 'approved' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(q.id, 'in_progress')} className="border-primary text-primary hover:bg-primary/15">Iniciar Serviço</Button>
                    )}
                    {q.status === 'in_progress' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(q.id, 'completed')} className="border-muted-foreground text-muted-foreground hover:bg-muted">Finalizar</Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && quotes.length > 0 && (
          <div className="text-center py-12 text-muted-foreground">Nenhum resultado encontrado</div>
        )}
      </div>
    </div>
  );
}
