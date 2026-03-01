import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { DollarSign, TrendingUp, Wrench, Package } from 'lucide-react';

export default function Financial() {
  const { quotes, services, getClient } = useData();

  const completedServices = useMemo(() => {
    return services
      .filter(s => s.status === 'completed')
      .map(s => {
        const quote = quotes.find(q => q.id === s.quoteId);
        if (!quote) return null;
        const partsRealCost = quote.parts.reduce((sum, p) => sum + p.price, 0);
        const partsMarkupAmount = partsRealCost * ((quote.partsMarkup || 0) / 100);
        const revenue = quote.total;
        const profit = partsMarkupAmount; // profit = markup on parts
        return {
          ...s,
          quote,
          clientName: getClient(s.clientId)?.name || 'Cliente',
          partsRealCost,
          partsMarkupAmount,
          laborCost: quote.laborCost,
          revenue,
          profit,
        };
      })
      .filter(Boolean) as Array<{
        id: string; quoteId: string; clientId: string; status: string;
        startedAt: string; completedAt?: string;
        quote: any; clientName: string;
        partsRealCost: number; partsMarkupAmount: number;
        laborCost: number; revenue: number; profit: number;
      }>;
  }, [quotes, services, getClient]);

  const totals = useMemo(() => {
    const totalRevenue = completedServices.reduce((s, x) => s + x.revenue, 0);
    const totalPartsCost = completedServices.reduce((s, x) => s + x.partsRealCost, 0);
    const totalLabor = completedServices.reduce((s, x) => s + x.laborCost, 0);
    const totalProfit = completedServices.reduce((s, x) => s + x.profit, 0);
    return { totalRevenue, totalPartsCost, totalLabor, totalProfit };
  }, [completedServices]);

  const fmt = (v: number) => `R$ ${v.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Financeiro</h1>
        <p className="text-muted-foreground text-sm">Resumo financeiro dos serviços finalizados</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-glow rounded-xl bg-card p-5 animate-slide-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Faturado</p>
              <p className="text-2xl font-heading font-bold mt-1">{fmt(totals.totalRevenue)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-success/15 text-success">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card-glow rounded-xl bg-card p-5 animate-slide-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gasto com Peças</p>
              <p className="text-2xl font-heading font-bold mt-1">{fmt(totals.totalPartsCost)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-warning/15 text-warning">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card-glow rounded-xl bg-card p-5 animate-slide-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pago a Mecânicos</p>
              <p className="text-2xl font-heading font-bold mt-1">{fmt(totals.totalLabor)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-primary/15 text-primary">
              <Wrench className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card-glow rounded-xl bg-card p-5 animate-slide-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Lucro (Markup Peças)</p>
              <p className="text-2xl font-heading font-bold mt-1 text-success">{fmt(totals.totalProfit)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-success/15 text-success">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {completedServices.length > 0 ? (
        <div className="card-glow rounded-xl bg-card p-5">
          <h3 className="font-heading font-semibold mb-4">Serviços Finalizados</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Faturado</th>
                  <th className="pb-3 font-medium">Custo Peças</th>
                  <th className="pb-3 font-medium">Mão de Obra</th>
                  <th className="pb-3 font-medium">Lucro</th>
                  <th className="pb-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {completedServices.map(s => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="py-3 font-medium">{s.clientName}</td>
                    <td className="py-3">{fmt(s.revenue)}</td>
                    <td className="py-3">{fmt(s.partsRealCost)}</td>
                    <td className="py-3">{fmt(s.laborCost)}</td>
                    <td className="py-3 text-success font-semibold">{fmt(s.profit)}</td>
                    <td className="py-3 text-muted-foreground">{s.completedAt ? new Date(s.completedAt).toLocaleDateString('pt-BR') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum serviço finalizado ainda. Finalize serviços para ver os dados financeiros.
        </div>
      )}
    </div>
  );
}
