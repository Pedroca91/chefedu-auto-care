import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ShopProvider, useShop } from "@/contexts/ShopContext";
import { DataProvider } from "@/contexts/DataContext";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Quotes from "./pages/Quotes";
import Services from "./pages/Services";
import Financial from "./pages/Financial";
import Agenda from "./pages/Agenda";
import VehicleHistory from "./pages/VehicleHistory";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ShopSettings from "./pages/ShopSettings";
import ShopUsers from "./pages/ShopUsers";
import NoShop from "./pages/NoShop";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="text-muted-foreground">Carregando...</span></div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, isSuperAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="text-muted-foreground">Carregando...</span></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function ShopRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { currentShopId, userRole, loading: shopLoading, shopUsers } = useShop();
  const { isSuperAdmin, loading: authLoading } = useAuth();

  if (authLoading || shopLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="text-muted-foreground">Carregando...</span></div>;

  if (!isSuperAdmin && shopUsers.length === 0) return <Navigate to="/no-shop" replace />;
  if (!currentShopId && !isSuperAdmin) return <Navigate to="/no-shop" replace />;

  if (requiredRole && !isSuperAdmin && userRole !== requiredRole && userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <ShopProvider>
          <DataProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/no-shop" element={<ProtectedRoute><NoShop /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route element={<ProtectedRoute><ShopRoute><Layout /></ShopRoute></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/quotes" element={<Quotes />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/financial" element={<Financial />} />
                  <Route path="/agenda" element={<Agenda />} />
                  <Route path="/vehicle-history" element={<VehicleHistory />} />
                  <Route path="/shop-settings" element={<ShopSettings />} />
                  <Route path="/shop-users" element={<ShopUsers />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </DataProvider>
        </ShopProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
