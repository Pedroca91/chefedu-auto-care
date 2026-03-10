export interface Shop {
  id: string;
  name: string;
  logo_url?: string | null;
  phone: string;
  whatsapp: string;
  address: string;
  email: string;
  primary_color: string;
  active: boolean;
  created_at: string;
}

export interface ShopUser {
  id: string;
  shop_id: string;
  user_id: string;
  role: ShopRole;
  created_at: string;
}

export type ShopRole = 'admin' | 'mechanic' | 'financial';

export interface Client {
  id: string;
  user_id: string;
  shop_id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  vehicles: Vehicle[];
  created_at: string;
}

export interface Vehicle {
  id: string;
  client_id: string;
  brand: string;
  model: string;
  plate: string;
  year: string;
  observations: string;
  created_at?: string;
}

export interface QuotePart {
  id: string;
  quote_id?: string;
  name: string;
  price: number;
  image_url?: string;
}

export interface Quote {
  id: string;
  user_id: string;
  shop_id: string;
  client_id: string;
  vehicle_id?: string | null;
  parts: QuotePart[];
  labor_cost: number;
  parts_markup: number;
  observations: string;
  status: QuoteStatus;
  total: number;
  parts_total: number;
  created_at: string;
}

export type QuoteStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';

export interface Service {
  id: string;
  user_id: string;
  shop_id: string;
  quote_id: string;
  client_id: string;
  vehicle_id?: string | null;
  status: 'in_progress' | 'completed';
  scheduled_date?: string | null;
  deadline?: string | null;
  started_at: string;
  completed_at?: string | null;
}

export interface Payment {
  id: string;
  service_id: string;
  shop_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  reminder_date?: string | null;
  created_at: string;
}

export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao' | 'transferencia';
export type PaymentStatus = 'paid' | 'partial' | 'pending';

export interface AuditEntry {
  id: string;
  user_id?: string | null;
  shop_id?: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
}

export interface VehicleInspection {
  id: string;
  service_id: string;
  shop_id: string;
  inspector_user_id?: string | null;
  notes: string;
  inspection_date: string;
  photos: InspectionPhoto[];
  created_at: string;
}

export interface InspectionPhoto {
  id: string;
  inspection_id: string;
  photo_url: string;
  label: string;
  created_at: string;
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

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  transferencia: 'Transferência',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Pago Total',
  partial: 'Parcial',
  pending: 'Pendente',
};

export const SHOP_ROLE_LABELS: Record<ShopRole, string> = {
  admin: 'Administrador',
  mechanic: 'Mecânico',
  financial: 'Financeiro',
};
