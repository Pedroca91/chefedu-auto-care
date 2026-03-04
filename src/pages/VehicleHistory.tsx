import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Car, Search, FileText, Wrench, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';

export default function VehicleHistory() {
  const { clients, getVehicleHistory } = useData();
  const [search, setSearch] = useState('');

  const allVehicles = useMemo(() => {
    return clients.flatMap(c =>
      c.vehicles.map(v => ({ ...v, clientName: c.name, clientId: c.id }))
    );
  }, [clients]);

  const filtered = allVehicles.filter(v =>
    !search ||
    `${v.brand} ${v.model} ${v.plate}`.toLowerCase().includes(search.toLowerCase()) ||
    v.clientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2"><Car className="h-8 w-8 text-primary" /> Histórico de Veículos</h1>
        <p className="text-muted-foreground text-sm">{allVehicles.length} veículos cadastrados</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por marca, modelo, placa ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-input border-border" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {allVehicles.length === 0 ? 'Nenhum veículo cadastrado.' : 'Nenhum resultado encontrado.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(v => {
            const history = getVehicleHistory(v.id);
            return (
              <div key={v.id} className="card-glow rounded-xl bg-card p-5 animate-slide-in">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                      <Car className="h-5 w-5 text-primary" />
                      {v.brand} {v.model}
                    </h3>
                    <p className="text-sm text-muted-foreground">Placa: {v.plate} • Ano: {v.year} • Cliente: {v.clientName}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-accent text-accent-foreground">
                    {history.length} serviço(s)
                  </span>
                </div>

                {history.length > 0 ? (
                  <div className="border-t border-border pt-3 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Histórico:</p>
                    {history.map(({ quote, service }) => (
                      <div key={quote.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-accent/50">
                        <div className="flex items-center gap-2">
                          {service?.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <Wrench className="h-4 w-4 text-primary" />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {quote.parts.map(p => p.name).join(', ') || 'Serviço'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(quote.created_at).toLocaleDateString('pt-BR')}
                              {quote.observations && ` • ${quote.observations}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-heading font-bold">R$ {quote.total.toFixed(2)}</span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[quote.status]}`}>
                            {STATUS_LABELS[quote.status]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground border-t border-border pt-3">Nenhum serviço registrado para este veículo.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
