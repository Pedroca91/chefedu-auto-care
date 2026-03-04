import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Calendar, Clock, Car, Wrench } from 'lucide-react';

export default function Agenda() {
  const { services, getClient, getQuote, getVehicle } = useData();

  const activeServices = useMemo(() => {
    return services
      .filter(s => s.status === 'in_progress')
      .sort((a, b) => {
        if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        return new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
      })
      .map(s => {
        const client = getClient(s.client_id);
        const quote = getQuote(s.quote_id);
        const vehicle = s.vehicle_id ? getVehicle(s.vehicle_id) : null;
        const daysActive = Math.floor((Date.now() - new Date(s.started_at).getTime()) / 86400000);
        const isOverdue = s.deadline && new Date(s.deadline) < new Date();
        return { ...s, client, quote, vehicle, daysActive, isOverdue };
      });
  }, [services, getClient, getQuote, getVehicle]);

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2"><Calendar className="h-8 w-8 text-primary" /> Agenda</h1>
        <p className="text-muted-foreground text-sm capitalize">{today}</p>
      </div>

      {activeServices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum serviço agendado ou em andamento.</div>
      ) : (
        <div className="space-y-3">
          {activeServices.map(s => (
            <div key={s.id} className={`card-glow rounded-xl bg-card p-5 animate-slide-in ${s.isOverdue ? 'ring-2 ring-destructive/50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-heading font-semibold text-lg">{s.client?.name || 'Cliente'}</p>
                  {s.vehicle && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Car className="h-3 w-3 text-primary" /> {s.vehicle.brand} {s.vehicle.model} • {s.vehicle.plate}
                    </p>
                  )}
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Wrench className="h-3 w-3" /> Iniciado: {new Date(s.started_at).toLocaleDateString('pt-BR')}
                    {s.quote && ` • R$ ${s.quote.total.toFixed(2)}`}
                  </p>
                  {s.scheduled_date && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" /> Agendado: {new Date(s.scheduled_date).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  {s.deadline && (
                    <p className={`flex items-center gap-1 text-sm ${s.isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                      <Clock className="h-3 w-3" /> Prazo: {new Date(s.deadline).toLocaleDateString('pt-BR')}
                      {s.isOverdue && ' ⚠️ ATRASADO'}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary">{s.daysActive} dias</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
