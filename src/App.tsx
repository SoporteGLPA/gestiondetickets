
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthPage } from "./components/auth/AuthPage";
import { MainLayout } from "./components/layout/MainLayout";
import { ArticleReader } from "./components/knowledge/ArticleReader";
import { NotificationManager } from "./components/notifications/NotificationManager";
import Index from "./pages/Index";
import Tickets from "./pages/Tickets";
import Knowledge from "./pages/Knowledge";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Departments from "./pages/settings/Departments";
import TicketStatuses from "./pages/settings/TicketStatuses";
import Company from "./pages/settings/Company";
import CollaborationAreas from "./pages/settings/CollaborationAreas";
import NotFound from "./pages/NotFound";
import TicketDetail from "./pages/TicketDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationManager />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Index />} />
              <Route path="tickets" element={<Tickets />} />
              <Route path="tickets/:id" element={
                <ProtectedRoute>
                  <TicketDetail />
                </ProtectedRoute>
              } />
              <Route path="knowledge" element={<Knowledge />} />
              <Route path="knowledge/:id" element={
                <ProtectedRoute>
                  <ArticleReader />
                </ProtectedRoute>
              } />
              <Route path="profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="users" element={
                <ProtectedRoute requiredRoles={['admin', 'agent']}>
                  <Users />
                </ProtectedRoute>
              } />
              <Route path="reports" element={
                <ProtectedRoute requiredRoles={['admin', 'agent']}>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="settings" element={
                <ProtectedRoute requiredRoles={['admin', 'agent']}>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="settings/departments" element={
                <ProtectedRoute requiredRoles={['admin', 'agent']}>
                  <Departments />
                </ProtectedRoute>
              } />
              <Route path="settings/ticket-statuses" element={
                <ProtectedRoute requiredRoles={['admin', 'agent']}>
                  <TicketStatuses />
                </ProtectedRoute>
              } />
              <Route path="settings/company" element={
                <ProtectedRoute requiredRoles={['admin', 'agent']}>
                  <Company />
                </ProtectedRoute>
              } />
              <Route path="settings/collaboration-areas" element={
                <ProtectedRoute requiredRoles={['admin', 'agent']}>
                  <CollaborationAreas />
                </ProtectedRoute>
              } />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
