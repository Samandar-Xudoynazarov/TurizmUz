import { Toaster } from "sonner";
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth-context';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import OrgDashboard from './pages/OrgDashboard';
import AdminPanel from './pages/AdminPanel';
import CalendarPage from './pages/CalendarPage';
import OrganizationDetail from './pages/OrganizationDetail';
import AdminEventDetail from './pages/AdminEventDetail';
import Profile from './pages/Profile';
import MyRegistrations from './pages/MyRegistrations';
import Management from './pages/Management';
import AdminAccommodations from './pages/AdminAccommodations';
import HotelsHostels from './pages/HotelsHostels';
import AccommodationDetail from './pages/AccommodationDetail';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/events" element={<Events />} />
            <Route path="/hotels-hostels" element={<HotelsHostels />} />
            <Route path="/accommodations/:type/:id" element={<AccommodationDetail />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/dashboard" element={<OrgDashboard />} />
            <Route path="/dashboard/calendar" element={<CalendarPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/calendar" element={<CalendarPage />} />
            <Route path="/admin/management" element={<Management />} />
            <Route path="/admin/accommodations" element={<AdminAccommodations />} />
            <Route path="/admin/accommodations/:type/:id" element={<AccommodationDetail />} />
            <Route path="/admin/organizations/:id" element={<OrganizationDetail />} />
            <Route path="/admin/events/:id" element={<AdminEventDetail />} />
            <Route path="/super-admin" element={<AdminPanel />} />
            <Route path="/super-admin/calendar" element={<CalendarPage />} />
            <Route path="/super-admin/management" element={<Management />} />
            <Route path="/super-admin/accommodations" element={<AdminAccommodations />} />
            <Route path="/super-admin/accommodations/:type/:id" element={<AccommodationDetail />} />
            <Route path="/super-admin/organizations/:id" element={<OrganizationDetail />} />
            <Route path="/super-admin/events/:id" element={<AdminEventDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-registrations" element={<MyRegistrations />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;