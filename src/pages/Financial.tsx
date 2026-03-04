import { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { DollarSign, TrendingUp, Wrench, Package, AlertCircle, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/types';
import type { PaymentStatus, PaymentMethod } from '@/types';

export default function Financial() {
  const { quotes, services, payments, auditLog, getClient } = useData();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tab, setTab] = useState<'resumo' | 'receber' | 'auditoria'>('resumo');

  const completedServices = useMemo(() => {
    return services
      .filter(s => {
        if (s.status !== 'completed') return false;
        if (dateFrom && s.completed_at && s.completed_at < dateFrom) return false;
        if (dateTo && s.completed_at && s.completed_at > dateTo + 'T23:59:59') return false;
        return true;
      })
      .map(s => {
        const quote = quotes.find(q => q.id === s.quote_id);
        if (!quote) return null;
        const partsRealCost = quote.parts.reduce((sum, p) => sum + p.price, 0);
        const partsMarkupAmount = partsRealCost * ((quote.parts_markup || 0) / 100);
        return {
          ...s, quote,
          clientName: getClient(s.client_id)?.name || 'Cliente',
          partsRealCost, partsMarkupAmount,
          laborCost: quote.labor_cost,
          revenue: quote.total,
          profit: partsMarkupAmount,
        };
      })
      .filter(Boolean) as any[];
  }, [quotes, services, getClient, dateFrom, dateTo]);

  const totals = useMemo(() => ({
    totalRevenue: completedServices.reduce((s, x) => s + x.revenue, 0),
    totalPartsCost: completedServices.reduce((s, x) => s + x.partsRealCost, 0),
    totalLabor: completedServices.reduce((s, x) => s + x.laborCost, 0),
    totalProfit: completedServices.reduce((s, x) => s + x.profit, 0),
  }), [completedServices]);

  const pendingPayments = useMemo(() => {
    return payments.filter(p => p.status !== 'paid').map(p => {
      const svc = services.find(s => s.id === p.service_id);
      const clientName = svc ? getClient(svc.client_id)?.name || 'Cliente' : 'Cliente';
      const daysOverdue = p.reminder_date ? Math.max(0, Math.floor((Date.now() - new Date(p.reminder_date).getTime()) / 86400000)) : 0;
      return { ...p, clientName, daysOverdue };
    });
  }, [payments, services, getClient]);

  const fmt = (v: number) => `R$ ${v.toFixed(2)}`;

  const tabs = [
    { id: 'resumo' as const, label: 'Resumo' },
    { id: 'receber' as const, label: `A Receber (${pendingPayments.length})` },
    { id: 'auditoria' as const, label: 'Auditoria' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Financeiro</h1>
        <p className="text-muted-foreground text-sm">Resumo financeiro dos serviços</p>
      </div>

      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resumo' && (
        <>
          <div className="flex gap-3 flex-wrap">
            <div className="space-y-1"><Label className="text-xs">De</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-input border-border w-40" /></div>
            <div className="space-y-1"><Label className="text-xs">Até</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-input border-border w-40" /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-glow rounded-xl bg-card p-5 animate-slide-in">
              <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Faturado</p><p className="text-2xl font-heading font-bold mt-1">{fmt(totals.totalRevenue)}</p></div><div className="h-12 w-12 rounded-lg flex items-center justify-center bg-success/15 text-success"><DollarSign className="h-6 w-6" /></div></div>
            </div>
            <div className="card-glow rounded-xl bg-card p-5 animate-slide-in">
              <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Gasto com Peças</p><p className="text-2xl font-heading font-bold mt-1">{fmt(totals.totalPartsCost)}</p></div><div className="h-12 w-12 rounded-lg flex items-center justify-center bg-warning/15 text-warning"><Package className="h-6 w-6" /></div></div>
            </div>
            <div className="card-glow rounded-xl bg-card p-5 animate-slide-in">
              <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pago a Mecânicos</p><p className="text-2xl font-heading font-bold mt-1">{fmt(totals.totalLabor)}</p></div><div className="h-12 w-12 rounded-lg flex items-center justify-center bg-primary/15 text-primary"><Wrench className="h-6 w-6" /></div></div>
            </div>
            <div className="card-glow rounded-xl bg-card p-5 animate-slide-in">
              <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Lucro (Markup)</p><p className="text-2xl font-heading font-bold mt-1 text-success">{fmt(totals.totalProfit)}</p></div><div className="h-12 w-12 rounded-lg flex items-center justify-center bg-success/15 text-success"><TrendingUp className="h-6 w-6" /></div></div>
            </div>
          </div>

          {completedServices.length > 0 ? (
            <div className="card-glow rounded-xl bg-card p-5">
              <h3 className="font-heading font-semibold mb-4">Serviços Finalizados</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-muted-foreground text-left">
                    <th className="pb-3 font-medium">Cliente</th><th className="pb-3 font-medium">Faturado</th><th className="pb-3 font-medium">Custo Peças</th><th className="pb-3 font-medium">Mão de Obra</th><th className="pb-3 font-medium">Lucro</th><th className="pb-3 font-medium">Data</th>
                  </tr></thead>
                  <tbody>
                    {completedServices.map((s: any) => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <td className="py-3 font-medium">{s.clientName}</td>
                        <td className="py-3">{fmt(s.revenue)}</td>
                        <td className="py-3">{fmt(s.partsRealCost)}</td>
                        <td className="py-3">{fmt(s.laborCost)}</td>
                        <td className="py-3 text-success font-semibold">{fmt(s.profit)}</td>
                        <td className="py-3 text-muted-foreground">{s.completed_at ? new Date(s.completed_at).toLocaleDateString('pt-BR') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">Nenhum serviço finalizado no período.</div>
          )}
        </>
      )}

      {tab === 'receber' && (
        <div className="space-y-3">
          {pendingPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhum valor pendente 🎉</div>
          ) : (
            pendingPayments.map(p => (
              <div key={p.id} className="card-glow rounded-xl bg-card p-5 animate-slide-in ring-2 ring-destructive/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading font-semibold">{p.clientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {PAYMENT_METHOD_LABELS[p.method as PaymentMethod]} • {PAYMENT_STATUS_LABELS[p.status as PaymentStatus]}
                    </p>
                    <p className="text-sm mt-1">
                      Pago: R$ {p.paid_amount.toFixed(2)} • <span className="text-destructive font-semibold">Restante: R$ {p.remaining_amount.toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    {p.daysOverdue > 0 && (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-semibold">{p.daysOverdue} dias em atraso</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'auditoria' && (
        <div className="space-y-2">
          {auditLog.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhum registro de auditoria.</div>
          ) : (
            auditLog.slice(0, 50).map(a => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                <History className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm"><span className="font-medium">{a.entity_type}</span> • {a.action}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString('pt-BR')}</p>
                  {a.details && Object.keys(a.details).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{JSON.stringify(a.details)}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
