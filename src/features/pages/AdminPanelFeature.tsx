import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SidebarLayout, { SidebarIcons } from "@/components/layout/SidebarLayout";
import {
  orgsApi,
  adminOrgsApi,
  usersApi,
  superAdminApi,
  eventsApi,
  adminUsersApi,
  adminEventsApi,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

import AdminNavbar from "@/features/admin-panel/components/AdminNavbar";
import AdminStats from "@/features/admin-panel/components/AdminStats";
import OrgsTab from "@/features/admin-panel/components/OrgsTab";
import UsersTab from "@/features/admin-panel/components/UsersTab";
import CalendarTab from "@/features/admin-panel/components/CalendarTab";
import RejectOrgDialog from "@/features/admin-panel/components/RejectOrgDialog";
import EventsTab from "@/features/admin-panel/components/EventsTab";
import RejectEventDialog from "@/features/admin-panel/components/RejectEventDialog";
import PendingDashboardTab from "@/features/admin-panel/components/PendingDashboardTab";
import {
  normalizeRoles,
  toArray,
  type EventItem,
  type OrgData,
  type UserData,
} from "@/features/admin-panel/helpers";

function getTabFromSearch(search: string) {
  const sp = new URLSearchParams(search);

  // ✅ Query bo‘lmasa default USERS ochiladi
  const t = sp.get("tab") || "users";

  const allowed = new Set(["dashboard", "orgs", "events", "users", "calendar"]);
  return allowed.has(t) ? t : "users";
}

export default function AdminPanelPage() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = hasRole("SUPER_ADMIN") ? "/super-admin" : "/admin";
  const panelLabel = hasRole("SUPER_ADMIN") ? "Super Admin" : "Admin";

  // ✅ tab URL query’dan keladi
  const tabFromUrl = useMemo(
    () => getTabFromSearch(location.search),
    [location.search],
  );
  const [tab, setTab] = useState<string>(tabFromUrl);

  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  const managementPath = `${basePath}/management`;

  // ✅ Tabs -> Sidebar
  const sidebarItems = [
    { label: `${panelLabel} panel`, to: basePath, icon: SidebarIcons.Admin },

    {
      label: "Kutilayotganlar",
      to: `${managementPath}?tab=dashboard`,
      icon: SidebarIcons.Dashboard,
    },
    {
      label: "Tashkilotlar",
      to: `${managementPath}?tab=orgs`,
      icon: SidebarIcons.Org,
    },
    {
      label: "Eventlar",
      to: `${managementPath}?tab=events`,
      icon: SidebarIcons.Calendar,
    },
    {
      label: "Foydalanuvchilar",
      to: `${managementPath}?tab=users`,
      icon: SidebarIcons.Users,
    },
    {
      label: "Kalendar",
      to: `${managementPath}?tab=calendar`,
      icon: SidebarIcons.Calendar,
    },

    {
      label: "Hotel / Hostel",
      to: `${basePath}/accommodations`,
      icon: SidebarIcons.Accommodations,
    },
    { label: "Tadbirlar", to: "/events", icon: SidebarIcons.Dashboard },
    { label: "Bosh sahifa", to: "/", icon: SidebarIcons.Home },
  ];

  const [orgs, setOrgs] = useState<OrgData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [pendingEvents, setPendingEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [rejectOrgId, setRejectOrgId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [rejectEventId, setRejectEventId] = useState<number | null>(null);
  const [rejectEventReason, setRejectEventReason] = useState("");
  const [calMonth, setCalMonth] = useState(new Date());

  useEffect(() => {
    if (!user || (!hasRole("ADMIN") && !hasRole("SUPER_ADMIN"))) {
      navigate("/login");
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orgsRes, usersRes, eventsRes, pendingEventsRes] =
        await Promise.all([
          orgsApi.getAll(),
          usersApi.getAll(),
          eventsApi.getAll(),
          adminEventsApi.pending(),
        ]);

      setOrgs(toArray<OrgData>(orgsRes.data));
      setUsers(toArray<UserData>(usersRes.data));
      setAllEvents(onlyFutureEvents(toArray<EventItem>(eventsRes.data)));
      setPendingEvents(onlyFutureEvents(toArray<EventItem>(pendingEventsRes.data)));
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const pendingOrgs = useMemo(() => orgs.filter((o) => !o.verified), [orgs]);
  const verifiedOrgs = useMemo(() => orgs.filter((o) => o.verified), [orgs]);
  const approvedEvents = useMemo(() => allEvents, [allEvents]);

  const adminUsers = useMemo(() => {
    return users
      .map((u) => ({ u, roles: normalizeRoles(u.roles) }))
      .filter(
        ({ roles }) =>
          roles.includes("ADMIN") && !roles.includes("SUPER_ADMIN"),
      )
      .map(({ u }) => u);
  }, [users]);

  // ✅ Tabni URL orqali almashtirish
  const goTab = useCallback(
    (t: string) => {
      const allowed = new Set([
        "dashboard",
        "orgs",
        "events",
        "users",
        "calendar",
      ]);
      const next = allowed.has(t) ? t : "users";
      navigate(`${managementPath}?tab=${next}`);
    },
    [navigate, managementPath],
  );

  const handleApprove = async (orgId: number) => {
    try {
      await adminOrgsApi.approve(orgId);
      toast.success("Tashkilot tasdiqlandi!");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik");
    }
  };

  const handleApproveEvent = async (eventId: number) => {
    try {
      await adminEventsApi.approve(eventId);
      toast.success("Event tasdiqlandi!");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik");
    }
  };

  const handleRejectEvent = async () => {
    if (!rejectEventId || !rejectEventReason.trim()) {
      toast.error("Sabab kiriting");
      return;
    }
    try {
      await adminEventsApi.reject(rejectEventId, rejectEventReason);
      toast.success("Event rad etildi");
      setRejectEventId(null);
      setRejectEventReason("");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik");
    }
  };

  const handleReject = async () => {
    if (!rejectOrgId || !rejectReason.trim()) {
      toast.error("Sabab kiriting");
      return;
    }
    try {
      await adminOrgsApi.reject(rejectOrgId, rejectReason);
      toast.success("Tashkilot rad etildi");
      setRejectOrgId(null);
      setRejectReason("");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik");
    }
  };

  const handleMakeAdmin = async (userId: number) => {
    if (!confirm("Bu foydalanuvchini ADMIN qilmoqchimisiz?")) return;
    try {
      await superAdminApi.makeAdmin(userId);
      toast.success("Foydalanuvchi ADMIN qilindi!");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik");
    }
  };

  const handleMakeOrganization = async (userId: number) => {
    if (
      !confirm(
        "Bu foydalanuvchini TASHKILOTCHI (TOUR_ORGANIZATION) qilmoqchimisiz?",
      )
    )
      return;
    try {
      await adminUsersApi.makeTour(userId);
      toast.success("Foydalanuvchi tashkilotchi qilindi!");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik");
    }
  };

  const handleToggleEnabled = async (userId: number, enabled: boolean) => {
    try {
      await usersApi.setEnabled(userId, !enabled);
      toast.success(
        enabled ? "Foydalanuvchi o'chirildi" : "Foydalanuvchi yoqildi",
      );
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik");
    }
  };

  if (loading) {
    return (
      <SidebarLayout title={panelLabel} items={sidebarItems}>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title={panelLabel} items={sidebarItems}>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <AdminNavbar
          panelLabel={panelLabel}
          onLogout={() => {
            logout();
            navigate("/");
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <AdminStats
            pendingOrgsCount={pendingOrgs.length}
            pendingEventsCount={pendingEvents.length}
            verifiedOrgsCount={verifiedOrgs.length}
            usersCount={users.length}
            eventsCount={approvedEvents.length}
            onOpenPendingOrgs={() => goTab("orgs")}
            onOpenPendingEvents={() => goTab("events")}
            onOpenVerifiedOrgs={() => goTab("orgs")}
            onOpenUsers={() => goTab("users")}
            onOpenEvents={() => goTab("events")}
          />

          {/* ✅ TabsList yo’q, faqat contentlar */}
          <Tabs value={tab} onValueChange={goTab} className="space-y-6">
            <TabsContent value="dashboard">
              <PendingDashboardTab
                basePath={basePath}
                pendingOrgs={pendingOrgs}
                pendingEvents={pendingEvents}
                onGoTab={(t) => goTab(t)}
                onApproveOrg={handleApprove}
                onOpenRejectOrg={(id) => {
                  setRejectOrgId(id);
                  setRejectReason("");
                }}
                onApproveEvent={handleApproveEvent}
                onOpenRejectEvent={(id) => {
                  setRejectEventId(id);
                  setRejectEventReason("");
                }}
              />
            </TabsContent>

            <TabsContent value="orgs">
              <OrgsTab
                orgs={orgs}
                pendingOrgs={pendingOrgs}
                basePath={basePath}
                onApprove={handleApprove}
                onOpenReject={(id) => {
                  setRejectOrgId(id);
                  setRejectReason("");
                }}
              />
            </TabsContent>

            <TabsContent value="events">
              <EventsTab
                basePath={basePath}
                pendingEvents={pendingEvents}
                approvedEvents={approvedEvents}
                onApprove={handleApproveEvent}
                onOpenReject={(id) => {
                  setRejectEventId(id);
                  setRejectEventReason("");
                }}
              />
            </TabsContent>

            <TabsContent value="users">
              <UsersTab
                users={users}
                adminUsers={adminUsers}
                hasRole={hasRole}
                onMakeAdmin={handleMakeAdmin}
                onMakeOrganization={handleMakeOrganization}
                onToggleEnabled={handleToggleEnabled}
              />
            </TabsContent>

            <TabsContent value="calendar">
              <CalendarTab
                allEvents={allEvents}
                calMonth={calMonth}
                setCalMonth={setCalMonth}
                onOpenEvent={(id) => navigate(`/events/${id}`)}
              />
            </TabsContent>
          </Tabs>
        </div>

        <RejectOrgDialog
          open={rejectOrgId !== null}
          reason={rejectReason}
          setReason={setRejectReason}
          onClose={() => setRejectOrgId(null)}
          onSubmit={handleReject}
        />

        <RejectEventDialog
          open={rejectEventId !== null}
          reason={rejectEventReason}
          setReason={setRejectEventReason}
          onClose={() => setRejectEventId(null)}
          onSubmit={handleRejectEvent}
        />
      </div>
    </SidebarLayout>
  );
}
