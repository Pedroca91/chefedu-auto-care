import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { Client, Vehicle, Quote, QuotePart, Service, Payment, AuditEntry } from '@/types';

interface DataContextType {
  clients: Client[];
  quotes: Quote[];
  services: Service[];
  payments: Payment[];
  auditLog: AuditEntry[];
  loading: boolean;
  addClient: (c: { name: string; phone: string; vehicles: Omit<Vehicle, 'id' | 'client_id'>[] }) => Promise<Client | null>;
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
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const [cRes, vRes, qRes, qpRes, sRes, pRes, aRes] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('vehicles').select('*'),
      supabase.from('quotes').select('*').order('created_at', { ascending: false }),
      supabase.from('quote_parts').select('*'),
      supabase.from('services').select('*').order('started_at', { ascending: false }),
      supabase.from('payments').select('*'),
      supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200),
    ]);

    const vehicles = (vRes.data || []) as Vehicle[];
    setAllVehicles(vehicles);

    const clientsData = (cRes.data || []).map((c: any) => ({
      ...c,
      vehicles: vehicles.filter(v => v.client_id === c.id),
    })) as Client[];
    setClients(clientsData);

    const parts = (qpRes.data || []) as QuotePart[];
    const quotesData = (qRes.data || []).map((q: any) => ({
      ...q,
      parts: parts.filter(p => p.quote_id === q.id),
      labor_cost: Number(q.labor_cost),
      parts_markup: Number(q.parts_markup),
      total: Number(q.total),
      parts_total: Number(q.parts_total),
    })) as Quote[];
    setQuotes(quotesData);

    setServices((sRes.data || []) as Service[]);
    setPayments((pRes.data || []).map((p: any) => ({
      ...p,
      total_amount: Number(p.total_amount),
      paid_amount: Number(p.paid_amount),
      remaining_amount: Number(p.remaining_amount),
    })) as Payment[]);
    setAuditLog((aRes.data || []) as AuditEntry[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addAudit = useCallback(async (entity_type: string, entity_id: string, action: string, details: Record<string, any> = {}) => {
    if (!user) return;
    await supabase.from('audit_log').insert({ user_id: user.id, entity_type, entity_id, action, details });
  }, [user]);

  const addClient = useCallback(async (c: { name: string; phone: string; vehicles: Omit<Vehicle, 'id' | 'client_id'>[] }) => {
    if (!user) return null;
    const { data, error } = await supabase.from('clients').insert({ user_id: user.id, name: c.name, phone: c.phone }).select().single();
    if (error || !data) return null;
    if (c.vehicles.length > 0) {
      await supabase.from('vehicles').insert(c.vehicles.map(v => ({ client_id: data.id, brand: v.brand, model: v.model, plate: v.plate, year: v.year })));
    }
    await addAudit('client', data.id, 'created', { name: c.name });
    await fetchAll();
    return clients.find(x => x.id === data.id) || { ...data, vehicles: [] } as Client;
  }, [user, addAudit, fetchAll, clients]);

  const updateClient = useCallback(async (c: Client) => {
    if (!user) return;
    await supabase.from('clients').update({ name: c.name, phone: c.phone }).eq('id', c.id);
    // Sync vehicles: delete old, insert new
    await supabase.from('vehicles').delete().eq('client_id', c.id);
    if (c.vehicles.length > 0) {
      await supabase.from('vehicles').insert(c.vehicles.map(v => ({ id: v.id || undefined, client_id: c.id, brand: v.brand, model: v.model, plate: v.plate, year: v.year })));
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
    if (!user) return null;
    const parts_total = q.parts.reduce((s, p) => s + p.price, 0);
    const markedUp = parts_total * (1 + (q.parts_markup || 0) / 100);
    const total = markedUp + q.labor_cost;
    const { data, error } = await supabase.from('quotes').insert({
      user_id: user.id, client_id: q.client_id, vehicle_id: q.vehicle_id || null,
      labor_cost: q.labor_cost, parts_markup: q.parts_markup, observations: q.observations,
      status: q.status, total, parts_total,
    }).select().single();
    if (error || !data) return null;
    if (q.parts.length > 0) {
      await supabase.from('quote_parts').insert(q.parts.map(p => ({ quote_id: data.id, name: p.name, price: p.price })));
    }
    await addAudit('quote', data.id, 'created', { total, client_id: q.client_id });
    await fetchAll();
    return quotes.find(x => x.id === data.id) || null;
  }, [user, addAudit, fetchAll, quotes]);

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
    if (!user) return null;
    // Check for duplicate
    const existing = services.find(s => s.quote_id === quoteId);
    if (existing) return existing;
    const { data, error } = await supabase.from('services').insert({
      user_id: user.id, quote_id: quoteId, client_id: clientId,
      vehicle_id: vehicleId || null, scheduled_date: scheduledDate || null, deadline: deadline || null,
    }).select().single();
    if (error || !data) return null;
    await addAudit('service', data.id, 'created', { quote_id: quoteId });
    await fetchAll();
    return data as Service;
  }, [user, addAudit, fetchAll, services]);

  const updateServiceStatus = useCallback(async (id: string, status: string) => {
    if (!user) return;
    const update: any = { status };
    if (status === 'completed') update.completed_at = new Date().toISOString();
    await supabase.from('services').update(update).eq('id', id);
    // Sync quote status
    const svc = services.find(s => s.id === id);
    if (svc && status === 'completed') {
      await supabase.from('quotes').update({ status: 'completed' }).eq('id', svc.quote_id);
    }
    await addAudit('service', id, 'status_changed', { status });
    await fetchAll();
  }, [user, addAudit, fetchAll, services]);

  const addPayment = useCallback(async (p: { service_id: string; method: string; status: string; total_amount: number; paid_amount: number; remaining_amount: number; reminder_date?: string | null }) => {
    if (!user) return null;
    const { data, error } = await supabase.from('payments').insert(p).select().single();
    if (error || !data) return null;
    await addAudit('payment', data.id, 'created', { method: p.method, status: p.status, amount: p.paid_amount });
    await fetchAll();
    return data as Payment;
  }, [user, addAudit, fetchAll]);

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
