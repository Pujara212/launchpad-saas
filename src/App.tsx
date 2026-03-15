import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import BookingPage from "./pages/BookingPage";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminBookings from "./pages/admin/Bookings";
import AdminServices from "./pages/admin/Services";
import AdminStaff from "./pages/admin/Staff";
import AdminAvailability from "./pages/admin/Availability";
import AdminAI from "./pages/admin/AIAssistant";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/"      element={<BookingPage />} />
            <Route path="/login" element={<AuthPage />} />
            {/* Admin */}
            <Route path="/admin"              element={<AdminDashboard />} />
            <Route path="/admin/bookings"     element={<AdminBookings />} />
            <Route path="/admin/services"     element={<AdminServices />} />
            <Route path="/admin/staff"        element={<AdminStaff />} />
            <Route path="/admin/availability" element={<AdminAvailability />} />
            <Route path="/admin/ai"           element={<AdminAI />} />
            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
