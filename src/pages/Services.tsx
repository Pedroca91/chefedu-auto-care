import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, Wrench } from 'lucide-react';
import { toast } from 'sonner';

export default function Services() {
  const { services, getClient, getQuote, updateServiceStatus } = useData();

  const handleComplete = (id: string) => {
    updateServiceStatus(id, 'completed');
    toast.success('Serviço finalizado!');
  };

  const active = services.filter(s => s.status === 'in_progress');
  const completed = services.filter(s => s.status === 'completed');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Serviços</h1>
        <p className="text-muted-foreground text-sm">{active.length} em andamento</p>
      </div>

      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" /> Em Andamento
          </h2>
          {active.map(s => {
            const client = getClient(s.clientId);
            const quote = getQuote(s.quoteId);
            return (
              <div key={s.id} className="card-glow rounded-xl bg-card p-5 flex items-center justify-between animate-slide-in">
                <div>
                  <p className="font-heading font-semibold">{client?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Iniciado: {new Date(s.startedAt).toLocaleDateString('pt-BR')}
                    {quote && ` • R$ ${quote.total.toFixed(2)}`}
                  </p>
                </div>
                <Button size="sm" onClick={() => handleComplete(s.id)} className="gradient-red hover:opacity-90">
                  <CheckCircle className="h-4 w-4 mr-1" /> Finalizar
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" /> Finalizados
          </h2>
          {completed.map(s => {
            const client = getClient(s.clientId);
            const quote = getQuote(s.quoteId);
            return (
              <div key={s.id} className="card-glow rounded-xl bg-card p-5 animate-slide-in opacity-70">
                <p className="font-heading font-semibold">{client?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Concluído: {s.completedAt && new Date(s.completedAt).toLocaleDateString('pt-BR')}
                  {quote && ` • R$ ${quote.total.toFixed(2)}`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {services.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum serviço ainda. Aprove um orçamento para criar um serviço.
        </div>
      )}
    </div>
  );
}
