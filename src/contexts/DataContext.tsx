import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useShop } from './ShopContext';
import type { Client, Vehicle, Quote, QuotePart, Service, Payment, AuditEntry } from '@/types';

interface DataContextType {
  clients: Client[];
  quotes: Quote[];
  services: Service[];
  payments: Payment[];
  auditLog: AuditEntry[];
  loading: boolean;
  addClient: (c: { name: string; phone: string; email?: string; address?: string; vehicles: Omit<Vehicle, 'id' | 'client_id' | 'observations'>[] }) => Promise<Client | null>;
  updateClient: (c: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addQuote: (q: { client_id: string; vehicle_id?: string | null; parts: Omit<QuotePart, 'id' | 'quote_id'>[]; labor_cost: number; parts_markup: number; observations: string; status: string }) => Promise<Quote | null>;
  updateQuote: (q: Quote) => Promise<void>;
  updateQuoteStatus: (id: string, status: string) => Promise<void>;
  addService: (quoteId: string, clientId: string, vehicleId?: string | null, scheduledDate?: string | null, deadline?: string | null) => Promise<Service | null>;
  updateServiceStatus: (id: string, status: string) => Promise<void>;
  addPayment: (p: { service_id: string; method: string; status: string; total_amount: number; paid_amount: number; remaining_amount: number; reminder_date?: string | null }) => Promise<Payment | null>;
  getClient: (id: string) => Client | undefined;
  getQuote: (id: string) => Quote | undefined;
  getVehicle: (id: string) => Vehicle | undefined;
  getServiceByQuoteId: (quoteId: string) => Service | undefined;
  getPaymentByServiceId: (serviceId: string) => Payment | undefined;
  getVehicleHistory: (vehicleId: string) => { quote: Quote; service: Service | undefined }[];
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);
export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be inside DataProvider');
  return ctx;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentShopId } = useShop();
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user || !currentShopId) { setLoading(false); return; }
    setLoading(true);

    const [cRes, vRes, qRes, qpRes, sRes, pRes, aRes] = await Promise.all([
      supabase.from('clients').select('*').eq('shop_id' as any, currentShopId).order('created_at', { ascending: false }),
      supabase.from('vehicles').select('*'),
      supabase.from('quotes').select('*').eq('shop_id' as any, currentShopId).order('created_at', { ascending: false }),
      supabase.from('quote_parts').select('*'),
      supabase.from('services').select('*').eq('shop_id' as any, currentShopId).order('started_at', { ascending: false }),
      supabase.from('payments').select('*').eq('shop_id' as any, currentShopId),
      supabase.from('audit_log').select('*').eq('shop_id' as any, currentShopId).order('created_at', { ascending: false }).limit(200),
    ]);

    const clientsRaw = (cRes.data || []) as any[];
    const clientIds = new Set(clientsRaw.map((c: any) => c.id));
    const vehicles = ((vRes.data || []) as any[]).filter(v => clientIds.has(v.client_id)) as Vehicle[];
    setAllVehicles(vehicles);

    const clientsData = clientsRaw.map((c: any) => ({
      ...c,
      email: c.email || '',
      address: c.address || '',
      vehicles: vehicles.filter(v => v.client_id === c.id),
    })) as Client[];
    setClients(clientsData);

    const quotesRaw = (qRes.data || []) as any[];
    const quoteIds = new Set(quotesRaw.map((q: any) => q.id));
    const parts = ((qpRes.data || []) as any[]).filter(p => quoteIds.has(p.quote_id)) as QuotePart[];
    const quotesData = quotesRaw.map((q: any) => ({
      ...q,
      parts: parts.filter(p => p.quote_id === q.id),
      labor_cost: Number(q.labor_cost),
      parts_markup: Number(q.parts_markup),
      total: Number(q.total),
      parts_total: Number(q.parts_total),
    })) as Quote[];
    setQuotes(quotesData);

    const servicesData = (sRes.data || []) as Service[];
    setServices(servicesData);

    const serviceIds = new Set(servicesData.map(s => s.id));
    setPayments(((pRes.data || []) as any[]).map((p: any) => ({
      ...p,
      total_amount: Number(p.total_amount),
      paid_amount: Number(p.paid_amount),
      remaining_amount: Number(p.remaining_amount),
    })) as Payment[]);

    setAuditLog((aRes.data || []) as AuditEntry[]);
    setLoading(false);
  }, [user, currentShopId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addAudit = useCallback(async (entity_type: string, entity_id: string, action: string, details: Record<string, any> = {}) => {
    if (!user || !currentShopId) return;
    await supabase.from('audit_log').insert({ user_id: user.id, shop_id: currentShopId, entity_type, entity_id, action, details } as any);
  }, [user, currentShopId]);

  const addClient = useCallback(async (c: { name: string; phone: string; email?: string; address?: string; vehicles: Omit<Vehicle, 'id' | 'client_id' | 'observations'>[] }) => {
    if (!user || !currentShopId) return null;
    const { data, error } = await supabase.from('clients').insert({ user_id: user.id, shop_id: currentShopId, name: c.name, phone: c.phone, email: c.email || '', address: c.address || '' } as any).select().single();
    if (error || !data) return null;
    const d = data as any;
    if (c.vehicles.length > 0) {
      await supabase.from('vehicles').insert(c.vehicles.map(v => ({ client_id: d.id, brand: v.brand, model: v.model, plate: v.plate, year: v.year })));
    }
    await addAudit('client', d.id, 'created', { name: c.name });
    await fetchAll();
    return clients.find(x => x.id === d.id) || { ...d, vehicles: [] } as Client;
  }, [user, currentShopId, addAudit, fetchAll, clients]);

  const updateClient = useCallback(async (c: Client) => {
    if (!user) return;
    await supabase.from('clients').update({ name: c.name, phone: c.phone, email: (c as any).email || '', address: (c as any).address || '' } as any).eq('id', c.id);
    await supabase.from('vehicles').delete().eq('client_id', c.id);
    if (c.vehicles.length > 0) {
      await supabase.from('vehicles').insert(c.vehicles.map(v => ({ id: v.id || undefined, client_id: c.id, brand: v.brand, model: v.model, plate: v.plate, year: v.year, observations: (v as any).observations || '' })));
    }
    await addAudit('client', c.id, 'updated', { name: c.name });
    await fetchAll();
  }, [user, addAudit, fetchAll]);

  const deleteClient = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('clients').delete().eq('id', id);
    await addAudit('client', id, 'deleted');
    await fetchAll();
  }, [user, addAudit, fetchAll]);

  const addQuote = useCallback(async (q: { client_id: string; vehicle_id?: string | null; parts: Omit<QuotePart, 'id' | 'quote_id'>[]; labor_cost: number; parts_markup: number; observations: string; status: string }) => {
    if (!user || !currentShopId) return null;
    const parts_total = q.parts.reduce((s, p) => s + p.price, 0);
    const markedUp = parts_total * (1 + (q.parts_markup || 0) / 100);
    const total = markedUp + q.labor_cost;
    const { data, error } = await supabase.from('quotes').insert({
      user_id: user.id, shop_id: currentShopId, client_id: q.client_id, vehicle_id: q.vehicle_id || null,
      labor_cost: q.labor_cost, parts_markup: q.parts_markup, observations: q.observations,
      status: q.status, total, parts_total,
    } as any).select().single();
    if (error || !data) return null;
    const d = data as any;
    if (q.parts.length > 0) {
      await supabase.from('quote_parts').insert(q.parts.map(p => ({ quote_id: d.id, name: p.name, price: p.price })));
    }
    await addAudit('quote', d.id, 'created', { total, client_id: q.client_id });
    await fetchAll();
    return quotes.find(x => x.id === d.id) || null;
  }, [user, currentShopId, addAudit, fetchAll, quotes]);

  const updateQuote = useCallback(async (q: Quote) => {
    if (!user) return;
    const parts_total = q.parts.reduce((s, p) => s + p.price, 0);
    const markedUp = parts_total * (1 + (q.parts_markup || 0) / 100);
    const total = markedUp + q.labor_cost;
    await supabase.from('quotes').update({
      labor_cost: q.labor_cost, parts_markup: q.parts_markup, observations: q.observations,
      status: q.status, total, parts_total, vehicle_id: q.vehicle_id || null,
    }).eq('id', q.id);
    await supabase.from('quote_parts').delete().eq('quote_id', q.id);
    if (q.parts.length > 0) {
      await supabase.from('quote_parts').insert(q.parts.map(p => ({ quote_id: q.id, name: p.name, price: p.price })));
    }
    await addAudit('quote', q.id, 'updated', { total });
    await fetchAll();
  }, [user, addAudit, fetchAll]);

  const updateQuoteStatus = useCallback(async (id: string, status: string) => {
    if (!user) return;
    await supabase.from('quotes').update({ status }).eq('id', id);
    await addAudit('quote', id, 'status_changed', { status });
    await fetchAll();
  }, [user, addAudit, fetchAll]);

  const addService = useCallback(async (quoteId: string, clientId: string, vehicleId?: string | null, scheduledDate?: string | null, deadline?: string | null) => {
    if (!user || !currentShopId) return null;
    const existing = services.find(s => s.quote_id === quoteId);
    if (existing) return existing;
    const { data, error } = await supabase.from('services').insert({
      user_id: user.id, shop_id: currentShopId, quote_id: quoteId, client_id: clientId,
      vehicle_id: vehicleId || null, scheduled_date: scheduledDate || null, deadline: deadline || null,
    } as any).select().single();
    if (error || !data) return null;
    const d = data as any;
    await addAudit('service', d.id, 'created', { quote_id: quoteId });
    await fetchAll();
    return d as Service;
  }, [user, currentShopId, addAudit, fetchAll, services]);

  const updateServiceStatus = useCallback(async (id: string, status: string) => {
    if (!user) return;
    const update: any = { status };
    if (status === 'completed') update.completed_at = new Date().toISOString();
    await supabase.from('services').update(update).eq('id', id);
    const svc = services.find(s => s.id === id);
    if (svc && status === 'completed') {
      await supabase.from('quotes').update({ status: 'completed' }).eq('id', svc.quote_id);
    }
    await addAudit('service', id, 'status_changed', { status });
    await fetchAll();
  }, [user, addAudit, fetchAll, services]);

  const addPayment = useCallback(async (p: { service_id: string; method: string; status: string; total_amount: number; paid_amount: number; remaining_amount: number; reminder_date?: string | null }) => {
    if (!user || !currentShopId) return null;
    const { data, error } = await supabase.from('payments').insert({ ...p, shop_id: currentShopId } as any).select().single();
    if (error || !data) return null;
    const d = data as any;
    await addAudit('payment', d.id, 'created', { method: p.method, status: p.status, amount: p.paid_amount });
    await fetchAll();
    return d as Payment;
  }, [user, currentShopId, addAudit, fetchAll]);

  const getClient = useCallback((id: string) => clients.find(c => c.id === id), [clients]);
  const getQuote = useCallback((id: string) => quotes.find(q => q.id === id), [quotes]);
  const getVehicle = useCallback((id: string) => allVehicles.find(v => v.id === id), [allVehicles]);
  const getServiceByQuoteId = useCallback((quoteId: string) => services.find(s => s.quote_id === quoteId), [services]);
  const getPaymentByServiceId = useCallback((serviceId: string) => payments.find(p => p.service_id === serviceId), [payments]);

  const getVehicleHistory = useCallback((vehicleId: string) => {
    return quotes
      .filter(q => q.vehicle_id === vehicleId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(q => ({ quote: q, service: services.find(s => s.quote_id === q.id) }));
  }, [quotes, services]);

  return (
    <DataContext.Provider value={{
      clients, quotes, services, payments, auditLog, loading,
      addClient, updateClient, deleteClient,
      addQuote, updateQuote, updateQuoteStatus,
      addService, updateServiceStatus, addPayment,
      getClient, getQuote, getVehicle, getServiceByQuoteId, getPaymentByServiceId,
      getVehicleHistory, refreshAll: fetchAll,
    }}>
      {children}
    </DataContext.Provider>
  );
};
