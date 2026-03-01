export interface Client {
  id: string;
  name: string;
  phone: string;
  vehicles: Vehicle[];
  createdAt: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year: string;
}

export interface QuotePart {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export interface Quote {
  id: string;
  clientId: string;
  vehicleId: string;
  parts: QuotePart[];
  laborCost: number;
  observations: string;
  status: QuoteStatus;
  total: number;
  createdAt: string;
}

export type QuoteStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';

export interface Service {
  id: string;
  quoteId: string;
  clientId: string;
  status: 'in_progress' | 'completed';
  startedAt: string;
  completedAt?: string;
}

export const STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Recusado',
  in_progress: 'Em Andamento',
  completed: 'Finalizado',
};

export const STATUS_COLORS: Record<QuoteStatus, string> = {
  pending: 'bg-warning text-warning-foreground',
  approved: 'bg-success text-success-foreground',
  rejected: 'bg-destructive text-destructive-foreground',
  in_progress: 'bg-primary text-primary-foreground',
  completed: 'bg-muted text-muted-foreground',
};
