import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useStore } from "./store/useStore";

import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const Login = lazy(() => import("./pages/Login"));
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Bills = lazy(() => import("./pages/Bills"));
const NewBill = lazy(() => import("./pages/NewBill"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Previews = lazy(() => import("./pages/Previews"));
const CalendarView = lazy(() => import("./pages/CalendarView"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
import { ErrorBoundary } from "./components/ErrorBoundary";

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
  </div>
);

const queryClient = new QueryClient();

import { toast as hotToast } from 'sonner';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const currentUser = useStore(state => state.currentUser);
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    hotToast.error('Permission Denied', { description: 'Your role does not have access to this page.' });
    return <Navigate to="/" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

import { useEffect } from "react";

const App = () => {
  const preferences = useStore(state => state.preferences);
  const setPreferences = useStore(state => state.setPreferences);

  useEffect(() => {
    if (!preferences.businessDetails?.address?.includes('ganugapalem')) {
      setPreferences({
        businessDetails: {
          ...preferences.businessDetails,
          name: 'Sadma Suppliers',
          tagline: 'Premium Quality (since 1977)',
          address: 'ganugapalem, ongole, Andhra Pradesh -523001',
          phone: '+91 9000000000, +91 8000000000, +91 7000000000, 08592-200000',
          terms: '1. Transportation and delivery charges are extra.\n2. Customers are fully liable for any damage or loss of rented items and must cover repair/replacement costs.\n3. All payments must be settled strictly according to the prior agreed terms.\n4. Late returns will incur additional daily rental fees.',
          signatureLabel: 'For Sadma Suppliers'
        }
      });
    }
  }, [preferences.businessDetails?.address, setPreferences]);

  return (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
                <Route path="/new-bill" element={<ProtectedRoute><NewBill /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><Inventory /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/manual" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
                
                <Route path="/404-previews" element={<Previews />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </QueryClientProvider>
  );
};

export default App;
