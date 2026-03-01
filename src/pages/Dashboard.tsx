import { useData } from '@/contexts/DataContext';
import { FileText, Users, Wrench, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { QuoteStatus } from '@/types';
import { STATUS_LABELS } from '@/types';

function StatCard({ icon: Icon, label, value, className }: { icon: any; label: string; value: number; className?: string }) {
  return (
    <div className="card-glow rounded-xl bg-card p-5 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-heading font-bold mt-1">{value}</p>
        </div>
        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${className || 'bg-primary/15 text-primary'}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { clients, quotes, services } = useData();

  const countByStatus = (s: QuoteStatus) => quotes.filter(q => q.status === s).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral da oficina</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Clientes" value={clients.length} />
        <StatCard icon={FileText} label="Orçamentos" value={quotes.length} className="bg-warning/15 text-warning" />
        <StatCard icon={Wrench} label="Serviços Ativos" value={services.filter(s => s.status === 'in_progress').length} className="bg-primary/15 text-primary" />
        <StatCard icon={CheckCircle} label="Finalizados" value={services.filter(s => s.status === 'completed').length} className="bg-success/15 text-success" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-glow rounded-xl bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-warning" />
            <h3 className="font-heading font-semibold">Pendentes</h3>
          </div>
          <p className="text-4xl font-heading font-bold text-warning">{countByStatus('pending')}</p>
        </div>
        <div className="card-glow rounded-xl bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-success" />
            <h3 className="font-heading font-semibold">Aprovados</h3>
          </div>
          <p className="text-4xl font-heading font-bold text-success">{countByStatus('approved')}</p>
        </div>
        <div className="card-glow rounded-xl bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-primary" />
            <h3 className="font-heading font-semibold">Em Andamento</h3>
          </div>
          <p className="text-4xl font-heading font-bold text-primary">{countByStatus('in_progress')}</p>
        </div>
      </div>

      {quotes.length > 0 && (
        <div className="card-glow rounded-xl bg-card p-5">
          <h3 className="font-heading font-semibold mb-4">Últimos Orçamentos</h3>
          <div className="space-y-3">
            {quotes.slice(-5).reverse().map(q => {
              const client = clients.find(c => c.id === q.clientId);
              return (
                <div key={q.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-sm">{client?.name || 'Cliente'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-bold text-sm">
                      R$ {q.total.toFixed(2)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      q.status === 'pending' ? 'bg-warning/15 text-warning' :
                      q.status === 'approved' ? 'bg-success/15 text-success' :
                      q.status === 'in_progress' ? 'bg-primary/15 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {STATUS_LABELS[q.status]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
