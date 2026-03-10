import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { Shop, ShopUser, ShopRole } from '@/types';

interface ShopContextType {
  shops: Shop[];
  currentShop: Shop | null;
  currentShopId: string | null;
  setCurrentShopId: (id: string) => void;
  userRole: ShopRole | null;
  shopUsers: ShopUser[];
  loading: boolean;
  refreshShops: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | null>(null);

export const useShop = () => {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be inside ShopProvider');
  return ctx;
};

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopUsers, setShopUsers] = useState<ShopUser[]>([]);
  const [currentShopId, setCurrentShopIdState] = useState<string | null>(
    localStorage.getItem('currentShopId')
  );
  const [loading, setLoading] = useState(true);

  const fetchShops = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const [shopsRes, membershipsRes] = await Promise.all([
      (supabase.from as any)('shops').select('*').order('created_at', { ascending: false }),
      (supabase.from as any)('shop_users').select('*').eq('user_id', user.id),
    ]);

    const shopsData = (shopsRes.data || []) as Shop[];
    const memberships = (membershipsRes.data || []) as ShopUser[];

    setShops(shopsData);
    setShopUsers(memberships);

    // Auto-select first shop if none selected or current not accessible
    const storedId = localStorage.getItem('currentShopId');
    const validShop = shopsData.find(s => s.id === storedId);
    if (!validShop && memberships.length > 0) {
      const firstId = memberships[0].shop_id;
      setCurrentShopIdState(firstId);
      localStorage.setItem('currentShopId', firstId);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { if (isAuthenticated) fetchShops(); }, [isAuthenticated, fetchShops]);

  const setCurrentShopId = (id: string) => {
    setCurrentShopIdState(id);
    localStorage.setItem('currentShopId', id);
  };

  const currentShop = shops.find(s => s.id === currentShopId) || null;
  const currentMembership = shopUsers.find(su => su.shop_id === currentShopId);
  const userRole = currentMembership?.role || null;

  return (
    <ShopContext.Provider value={{
      shops, currentShop, currentShopId, setCurrentShopId,
      userRole, shopUsers, loading, refreshShops: fetchShops,
    }}>
      {children}
    </ShopContext.Provider>
  );
};
