import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import PWABadge from './components/pwa/PWABadge';
import { MedicationAlarmProvider } from "@/providers/MedicationAlarmProvider";
import { PanicShortcutListener } from "@/components/emergency/PanicShortcutListener";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Medications = lazy(() => import("./pages/Medications"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Documents = lazy(() => import("./pages/Documents"));
const Settings = lazy(() => import("./pages/Settings"));
const Doctors = lazy(() => import("./pages/Doctors"));
const Help = lazy(() => import("./pages/Help"));
const Pricing = lazy(() => import("./pages/Pricing"));
const SharedView = lazy(() => import("./pages/SharedView"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LandingPageEditor = lazy(() => import("./pages/admin/LandingPageEditor"));
import { AdminRoute } from "@/components/admin/AdminRoute";

const queryClient = new QueryClient();

const Loading = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

import { FamilyProvider } from "@/hooks/useFamily";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FamilyProvider>
        <TooltipProvider>
          <PWABadge />
          <Toaster />
          <Sonner />
          <MedicationAlarmProvider>
            <PanicShortcutListener />
            <BrowserRouter>
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/medications" element={<Medications />} />
                    <Route path="/appointments" element={<Appointments />} />
                    <Route path="/doctors" element={<Doctors />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route
                      path="/admin/landing"
                      element={
                        <AdminRoute>
                          <LandingPageEditor />
                        </AdminRoute>
                      }
                    />
                  </Route>
                  <Route path="/shared/:token" element={<SharedView />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </MedicationAlarmProvider>
        </TooltipProvider>
      </FamilyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
