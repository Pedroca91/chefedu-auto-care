import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Client, Quote, Service } from '@/types';

interface DataContextType {
  clients: Client[];
  quotes: Quote[];
  services: Service[];
  addClient: (c: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (c: Client) => void;
  deleteClient: (id: string) => void;
  addQuote: (q: Omit<Quote, 'id' | 'createdAt' | 'total' | 'partsTotal'>) => Quote;
  updateQuote: (q: Quote) => void;
  updateQuoteStatus: (id: string, status: Quote['status']) => void;
  addService: (quoteId: string, clientId: string) => Service;
  updateServiceStatus: (id: string, status: Service['status']) => void;
  getClient: (id: string) => Client | undefined;
  getQuote: (id: string) => Quote | undefined;
}

const DataContext = createContext<DataContextType | null>(null);
export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be inside DataProvider');
  return ctx;
};

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

const uid = () => crypto.randomUUID();

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>(() => load('chefedu_clients', []));
  const [quotes, setQuotes] = useState<Quote[]>(() => load('chefedu_quotes', []));
  const [services, setServices] = useState<Service[]>(() => load('chefedu_services', []));

  const persist = useCallback((key: string, data: any[]) => save(key, data), []);

  const addClient = useCallback((c: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = { ...c, id: uid(), createdAt: new Date().toISOString() };
    setClients(prev => { const n = [...prev, newClient]; persist('chefedu_clients', n); return n; });
    return newClient;
  }, [persist]);

  const updateClient = useCallback((c: Client) => {
    setClients(prev => { const n = prev.map(x => x.id === c.id ? c : x); persist('chefedu_clients', n); return n; });
  }, [persist]);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => { const n = prev.filter(x => x.id !== id); persist('chefedu_clients', n); return n; });
  }, [persist]);

  const addQuote = useCallback((q: Omit<Quote, 'id' | 'createdAt' | 'total' | 'partsTotal'>) => {
    const partsTotal = q.parts.reduce((s, p) => s + p.price, 0);
    const markedUpParts = partsTotal * (1 + (q.partsMarkup || 0) / 100);
    const total = markedUpParts + q.laborCost;
    const newQuote: Quote = { ...q, id: uid(), partsTotal, total, createdAt: new Date().toISOString() };
    setQuotes(prev => { const n = [...prev, newQuote]; persist('chefedu_quotes', n); return n; });
    return newQuote;
  }, [persist]);

  const updateQuote = useCallback((q: Quote) => {
    const partsTotal = q.parts.reduce((s, p) => s + p.price, 0);
    const markedUpParts = partsTotal * (1 + (q.partsMarkup || 0) / 100);
    const total = markedUpParts + q.laborCost;
    const updated = { ...q, partsTotal, total };
    setQuotes(prev => { const n = prev.map(x => x.id === updated.id ? updated : x); persist('chefedu_quotes', n); return n; });
  }, [persist]);

  const updateQuoteStatus = useCallback((id: string, status: Quote['status']) => {
    setQuotes(prev => { const n = prev.map(q => q.id === id ? { ...q, status } : q); persist('chefedu_quotes', n); return n; });
  }, [persist]);

  const addService = useCallback((quoteId: string, clientId: string) => {
    const s: Service = { id: uid(), quoteId, clientId, status: 'in_progress', startedAt: new Date().toISOString() };
    setServices(prev => { const n = [...prev, s]; persist('chefedu_services', n); return n; });
    return s;
  }, [persist]);

  const updateServiceStatus = useCallback((id: string, status: Service['status']) => {
    setServices(prev => {
      const n = prev.map(s => s.id === id ? { ...s, status, completedAt: status === 'completed' ? new Date().toISOString() : s.completedAt } : s);
      persist('chefedu_services', n);
      return n;
    });
  }, [persist]);

  const getClient = useCallback((id: string) => clients.find(c => c.id === id), [clients]);
  const getQuote = useCallback((id: string) => quotes.find(q => q.id === id), [quotes]);

  return (
    <DataContext.Provider value={{ clients, quotes, services, addClient, updateClient, deleteClient, addQuote, updateQuote, updateQuoteStatus, addService, updateServiceStatus, getClient, getQuote }}>
      {children}
    </DataContext.Provider>
  );
};
