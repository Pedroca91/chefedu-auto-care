import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/types';
import type { PaymentMethod, PaymentStatus } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  totalAmount: number;
  onConfirm: (data: { method: PaymentMethod; status: PaymentStatus; paid_amount: number; reminder_date?: string | null }) => void;
}

export default function FinalizeModal({ open, onOpenChange, totalAmount, onConfirm }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [status, setStatus] = useState<PaymentStatus>('paid');
  const [paidAmount, setPaidAmount] = useState(totalAmount.toString());

  const paid = parseFloat(paidAmount) || 0;
  const remaining = Math.max(0, totalAmount - paid);

  const handleConfirm = () => {
    // Calculate reminder: 7 business days from now
    let reminderDate: string | null = null;
    if (remaining > 0) {
      const d = new Date();
      let daysAdded = 0;
      while (daysAdded < 7) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() !== 0 && d.getDay() !== 6) daysAdded++;
      }
      reminderDate = d.toISOString().split('T')[0];
    }
    onConfirm({ method, status, paid_amount: paid, reminder_date: reminderDate });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader><DialogTitle className="font-heading">Finalizar Serviço</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent">
            <span className="text-sm text-muted-foreground">Total do serviço</span>
            <span className="text-xl font-heading font-bold text-primary">R$ {totalAmount.toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select value={method} onValueChange={v => setMethod(v as PaymentMethod)}>
              <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(m => (
                  <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status do Pagamento</Label>
            <Select value={status} onValueChange={v => setStatus(v as PaymentStatus)}>
              <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Valor Pago (R$)</Label>
            <Input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="bg-input border-border" step="0.01" />
          </div>

          {remaining > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive font-medium">Valor restante: R$ {remaining.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Lembrete automático será criado em 7 dias úteis</p>
            </div>
          )}

          <Button onClick={handleConfirm} className="w-full gradient-red hover:opacity-90">Confirmar Finalização</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
