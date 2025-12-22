import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import PaymentRequired from "./pages/PaymentRequired";
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/dashboard/Orders";
import Listings from "./pages/dashboard/Listings";
import ExtensionConnect from "./pages/dashboard/ExtensionConnect";
import Subscription from "./pages/dashboard/Subscription";
import DashboardSettings from "./pages/dashboard/Settings";
import DashboardPrompts from "./pages/dashboard/Prompts";
import CalculatorSettings from "./pages/dashboard/CalculatorSettings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminNotices from "./pages/admin/AdminNotices";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminPrompts from "./pages/admin/AdminPrompts";
import NotFound from "./pages/NotFound";
import Course from "./pages/Course";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/course" element={<Course />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/register" element={<Register />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/payment-required" element={<PaymentRequired />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* Protected Dashboard Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="listings" element={<Listings />} />
                <Route path="orders" element={<Orders />} />
                <Route path="alerts" element={<Dashboard />} />
                <Route path="prompts" element={<DashboardPrompts />} />
                <Route path="credits" element={<Dashboard />} />
                <Route path="subscription" element={<Subscription />} />
                <Route path="extension" element={<ExtensionConnect />} />
                <Route path="calculator" element={<CalculatorSettings />} />
                <Route path="settings" element={<DashboardSettings />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="plans" element={<AdminPlans />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="roles" element={<AdminRoles />} />
                <Route path="notices" element={<AdminNotices />} />
                <Route path="prompts" element={<AdminPrompts />} />
                <Route path="audit" element={<AdminAudit />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
