import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi, safeArray } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  CalendarDays,
  MapPin,
  Clock,
  Search,
  LogIn,
  LogOut,
  LayoutDashboard,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';

interface EventItem {
  id: number;
  title: string;
  description: string;
  locationName: string;
  eventDateTime: string;
  organizationName?: string;
  // backend bo'lsa: moderatsiya holati
  status?: string;
  approved?: boolean;
  published?: boolean;
}

function isApprovedEvent(e: EventItem) {
  const status = String((e as any)?.status || '').toUpperCase();
  if (status) {
    return ['APPROVED', 'PUBLISHED', 'PUBLIC', 'ACTIVE'].includes(status);
  }
  if ((e as any)?.approved === true) return true;
  if ((e as any)?.published === true) return true;
  // status/approved/published umuman bo'lmasa — backend ehtimol hamma eventni public qaytaradi
  return true;
}

function isFutureEvent(e: EventItem) {
  const d = new Date(e.eventDateTime);
  if (Number.isNaN(+d)) return true;
  return +d >= Date.now();
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    eventsApi
      .getAll()
      .then((r) => {
        setEvents(safeArray(r));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = !!user && (user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN'));
  const isOrg = !!user && user.roles.includes('TOUR_ORGANIZATION');

  const visibleEvents = (isAdmin || isOrg ? events : events.filter(isApprovedEvent)).filter(isFutureEvent);

  const filtered = visibleEvents.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.locationName.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">EventHub</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/events">
              <Button variant="ghost" size="sm" className="text-indigo-600">Tadbirlar</Button>
            </Link>
            {user ? (
              <>
                {(user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN')) && (
                  <Link to={user.roles.includes('SUPER_ADMIN') ? '/super-admin' : '/admin'}>
                    <Button variant="ghost" size="sm">
                      <LayoutDashboard className="w-4 h-4 mr-1" />
                      {user.roles.includes('SUPER_ADMIN') ? 'Super Admin' : 'Admin'}
                    </Button>
                  </Link>
                )}
                {user.roles.includes('TOUR_ORGANIZATION') && (
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm"><Building2 className="w-4 h-4 mr-1" />Dashboard</Button>
                  </Link>
                )}
                <Link to="/profile">
                  <Button variant="ghost" size="sm">Profil</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-1" />Chiqish
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  <LogIn className="w-4 h-4 mr-1" />Kirish
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Barcha tadbirlar</h1>
            <p className="text-gray-500 mt-1">{filtered.length} ta tadbir topildi</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-0 shadow-sm animate-pulse">
                <div className="h-40 bg-gray-200 rounded-t-lg" />
                <CardContent className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg">Tadbirlar topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event) => (
              <Link to={`/events/${event.id}`} key={event.id}>
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm overflow-hidden h-full">
                  <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative">
                    <CalendarDays className="w-12 h-12 text-white/20" />
                    <div className="absolute top-3 right-3">
                      <span className="bg-white/90 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
                        {format(new Date(event.eventDateTime), 'dd MMM')}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                    <div className="flex flex-col gap-2 mt-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(event.eventDateTime), 'dd MMM yyyy, HH:mm')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.locationName}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}