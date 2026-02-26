import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import SidebarLayout, { SidebarIcons } from "@/components/layout/SidebarLayout";
import { Button } from "@/components/ui/button";
import { CalendarDays, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

import { useOrgDashboard } from "@/features/org-dashboard/hooks/useOrgDashboard";
import CreateOrgCard from "@/features/org-dashboard/components/CreateOrgCard";
import OrgSummaryCard from "@/features/org-dashboard/components/OrgSummaryCard";
import CreateEventDialog from "@/features/org-dashboard/components/CreateEventDialog";
import MyEventsList from "@/features/org-dashboard/components/MyEventsList";
import RegistrationsDialog from "@/features/org-dashboard/components/RegistrationsDialog";

export default function OrgDashboardFeature() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const rawId = (user as any)?.id ?? (user as any)?.userId ?? (user as any)?.sub;
  const userId = rawId ? Number(rawId) : undefined;

  const {
    orgs,
    org,
    events,
    stats,
    regsOpenFor,
    regs,
    loading,
    regsLoading,
    orgReadyForEvents,
    actions,
  } = useOrgDashboard(userId);

  const sidebarItems = [
    { label: "Dashboard", to: "/dashboard", icon: SidebarIcons.Dashboard },
    { label: "Kalendar", to: "/dashboard/calendar", icon: SidebarIcons.Calendar },
    { label: "Tadbirlar", to: "/events", icon: SidebarIcons.Home },
    { label: "Bosh sahifa", to: "/", icon: SidebarIcons.Home },
  ];

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  if (loading) {
    return (
      <SidebarLayout title="Organizatsiya" items={sidebarItems}>
        <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      </SidebarLayout>
    );
  }

  const hasOrgs = orgs && orgs.length > 0;

  return (
    <SidebarLayout title="Organizatsiya" items={sidebarItems}>
      <div className="min-h-screen bg-gray-50">
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
                <Button variant="ghost" size="sm">
                  Tadbirlar
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" size="sm">
                  Profil
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await logout();
                  navigate("/", { replace: true });
                }}
              >
                <LogOut className="w-4 h-4 mr-1" /> Chiqish
              </Button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Tashkilotchi panel</h1>

            {org ? (
              <CreateEventDialog
                disabled={!orgReadyForEvents}
                organizationId={org.id}
                onCreate={actions.createEvent}
              />
            ) : null}
          </div>

          {/* ✅ Agar backend token bo‘yicha org qaytarmasa -> create org */}
          {!org && !hasOrgs ? <CreateOrgCard onCreated={actions.reload} /> : null}

          {/* ✅ Org bo‘lsa -> normal dashboard */}
          {org ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <OrgSummaryCard org={org} />

                {!orgReadyForEvents ? (
                  <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    Tashkilot tasdiqlanmagan. Tadbir yaratish uchun admin tasdiqlashini kuting.
                    <div className="mt-2">
                      <Button variant="outline" size="sm" onClick={actions.reload}>
                        Yangilash
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="lg:col-span-2">
                <MyEventsList
                  events={events}
                  stats={stats}
                  onOpenRegs={actions.openRegs}
                  onDelete={actions.deleteEvent}
                />
              </div>
            </div>
          ) : null}

          {/* ✅ Agar org yo‘q, lekin orgs bor bo‘lsa => backend noto‘g‘ri qaytaryapti degani */}
          {!org && hasOrgs ? (
            <div className="bg-white border rounded-xl p-4">
              <div className="font-semibold text-gray-900">Diqqat</div>
              <div className="text-sm text-gray-600 mt-1">
                Backend <code>/api/organizations</code> token bo‘yicha sizga tegishli orgni qaytarmayapti.
                Frontend ID tekshirmaydi. Backendni token asosida filtr qilish kerak.
              </div>
              <div className="mt-3">
                <Button variant="outline" onClick={actions.reload}>
                  Qayta yuklash
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <RegistrationsDialog
          openFor={regsOpenFor}
          regs={regs}
          loading={regsLoading}
          onClose={actions.closeRegs}
        />
      </div>
    </SidebarLayout>
  );
}