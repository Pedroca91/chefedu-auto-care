import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, Wrench, AlertCircle, Camera } from 'lucide-react';
import { toast } from 'sonner';
import FinalizeModal from '@/components/FinalizeModal';
import VehicleInspection from '@/components/VehicleInspection';
import { PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/types';
import type { PaymentMethod, PaymentStatus } from '@/types';

export default function Services() {
  const { services, getClient, getQuote, updateServiceStatus, addPayment, getPaymentByServiceId } = useData();
  const [finalizeId, setFinalizeId] = useState<string | null>(null);
  const [finalizeTotal, setFinalizeTotal] = useState(0);
  const [inspectionServiceId, setInspectionServiceId] = useState<string | null>(null);

  const handleFinalize = (id: string) => {
    const svc = services.find(s => s.id === id);
    if (!svc) return;
    const quote = getQuote(svc.quote_id);
    setFinalizeTotal(quote?.total || 0);
    setFinalizeId(id);
  };

  const confirmFinalize = async (data: { method: PaymentMethod; status: PaymentStatus; paid_amount: number; reminder_date?: string | null }) => {
    if (!finalizeId) return;
    await addPayment({
      service_id: finalizeId, method: data.method, status: data.status,
      total_amount: finalizeTotal, paid_amount: data.paid_amount,
      remaining_amount: Math.max(0, finalizeTotal - data.paid_amount),
      reminder_date: data.reminder_date,
    });
    await updateServiceStatus(finalizeId, 'completed');
    toast.success('Serviço finalizado!');
    setFinalizeId(null);
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
          <h2 className="font-heading font-semibold text-lg flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> Em Andamento</h2>
          {active.map(s => {
            const client = getClient(s.client_id);
            const quote = getQuote(s.quote_id);
            return (
              <div key={s.id} className="card-glow rounded-xl bg-card p-5 animate-slide-in">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-heading font-semibold">{client?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Iniciado: {new Date(s.started_at).toLocaleDateString('pt-BR')}
                      {quote && ` • R$ ${quote.total.toFixed(2)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setInspectionServiceId(s.id)} className="border-border">
                      <Camera className="h-4 w-4 mr-1" /> Inspeção
                    </Button>
                    <Button size="sm" onClick={() => handleFinalize(s.id)} className="gradient-red hover:opacity-90">
                      <CheckCircle className="h-4 w-4 mr-1" /> Finalizar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-lg flex items-center gap-2"><CheckCircle className="h-5 w-5 text-success" /> Finalizados</h2>
          {completed.map(s => {
            const client = getClient(s.client_id);
            const quote = getQuote(s.quote_id);
            const payment = getPaymentByServiceId(s.id);
            const isPending = payment && payment.status !== 'paid';
            return (
              <div key={s.id} className={`card-glow rounded-xl bg-card p-5 animate-slide-in ${isPending ? 'ring-2 ring-destructive/50' : 'opacity-70'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading font-semibold">{client?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Concluído: {s.completed_at && new Date(s.completed_at).toLocaleDateString('pt-BR')}
                      {quote && ` • R$ ${quote.total.toFixed(2)}`}
                    </p>
                    {payment && (
                      <p className="text-xs mt-1">
                        <span className={payment.status === 'paid' ? 'text-success' : 'text-destructive'}>
                          {PAYMENT_STATUS_LABELS[payment.status as PaymentStatus]}
                        </span>
                        {' • '}{PAYMENT_METHOD_LABELS[payment.method as PaymentMethod]}
                        {payment.remaining_amount > 0 && <span className="text-destructive"> • Restante: R$ {payment.remaining_amount.toFixed(2)}</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setInspectionServiceId(s.id)} className="border-border">
                      <Camera className="h-4 w-4" />
                    </Button>
                    {isPending && <AlertCircle className="h-5 w-5 text-destructive" />}
                  </div>
                </div>
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

      <FinalizeModal
        open={!!finalizeId}
        onOpenChange={v => { if (!v) setFinalizeId(null); }}
        totalAmount={finalizeTotal}
        onConfirm={confirmFinalize}
      />

      <VehicleInspection
        open={!!inspectionServiceId}
        onOpenChange={v => { if (!v) setInspectionServiceId(null); }}
        serviceId={inspectionServiceId || ''}
      />
    </div>
  );
}
