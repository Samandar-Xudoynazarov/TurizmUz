import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SidebarLayout, { SidebarIcons } from "@/components/layout/SidebarLayout";
import { adminEventsApi, eventsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import RejectEventDialog from "@/features/admin-panel/components/RejectEventDialog";

type EventData = {
  id: number;
  title: string;
  description: string;
  locationName: string;
  eventDateTime: string;
  organizationName?: string;
};

export default function AdminEventDetailPage() {
  const { id } = useParams();
  const eventId = Number(id);
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const basePath = hasRole("SUPER_ADMIN") ? "/super-admin" : "/admin";
  const panelLabel = hasRole("SUPER_ADMIN") ? "Super Admin" : "Admin";

  const sidebarItems = [
    { label: `${panelLabel} panel`, to: basePath, icon: SidebarIcons.Admin },
    { label: "Management", to: `${basePath}/management`, icon: SidebarIcons.Users },
    { label: "Kalendar", to: `${basePath}/calendar`, icon: SidebarIcons.Calendar },
    { label: "Tadbirlar", to: "/events", icon: SidebarIcons.Dashboard },
    { label: "Bosh sahifa", to: "/", icon: SidebarIcons.Home },
  ];

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromPending, setFromPending] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const isPending = useMemo(() => fromPending, [fromPending]);

  const load = async () => {
    setLoading(true);
    setFromPending(false);
    try {
      // 1) Avval public endpointdan urinib ko'ramiz (tasdiqlangan bo'lishi mumkin)
      const res = await eventsApi.getById(eventId);
      setEvent(res.data);
      setFromPending(false);
    } catch {
      // 2) Pending ro'yxatdan topamiz
      try {
        const pendingRes = await adminEventsApi.pending();
        const list: EventData[] = Array.isArray(pendingRes.data)
          ? pendingRes.data
          : Array.isArray(pendingRes.data?.content)
            ? pendingRes.data.content
            : Array.isArray(pendingRes.data?.items)
              ? pendingRes.data.items
              : [];
        const found = list.find((x) => x.id === eventId) || null;
        if (!found) throw new Error("not found");
        setEvent(found);
        setFromPending(true);
      } catch {
        toast.error("Event topilmadi yoki ruxsat yo'q");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || (!hasRole("ADMIN") && !hasRole("SUPER_ADMIN"))) {
      navigate("/login");
      return;
    }
    if (!eventId) {
      toast.error("Event ID noto‘g‘ri");
      navigate(basePath);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const approve = async () => {
    try {
      await adminEventsApi.approve(eventId);
      toast.success("Event tasdiqlandi!");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik");
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Sabab kiriting");
      return;
    }
    try {
      await adminEventsApi.reject(eventId, rejectReason);
      toast.success("Event rad etildi");
      setRejectOpen(false);
      setRejectReason("");
      navigate(basePath);
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

  if (!event) {
    return (
      <SidebarLayout title={panelLabel} items={sidebarItems}>
        <div className="p-6">
          <p className="text-sm text-gray-600">Event topilmadi.</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate(basePath)}>
            Orqaga
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title={panelLabel} items={sidebarItems}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{event.title}</h1>
            <div className="mt-2 flex gap-2 flex-wrap">
              {isPending ? (
                <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                  Kutilmoqda
                </Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Tasdiqlangan</Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {isPending ? (
              <>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={approve}>
                  Tasdiqlash
                </Button>
                <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                  Rad etish
                </Button>
              </>
            ) : null}
            <Button variant="outline" onClick={() => navigate(basePath)}>
              Orqaga
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Event ma&apos;lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-gray-500">Tavsif</p>
              <p className="text-sm text-gray-900 whitespace-pre-line">{event.description || "-"}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Manzil</p>
                <p className="text-sm text-gray-900">{event.locationName || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sana/Vaqt</p>
                <p className="text-sm text-gray-900">{new Date(event.eventDateTime).toLocaleString()}</p>
              </div>
            </div>

            {event.organizationName ? (
              <div>
                <p className="text-xs text-gray-500">Tashkilot</p>
                <p className="text-sm text-gray-900">{event.organizationName}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <RejectEventDialog
          open={rejectOpen}
          reason={rejectReason}
          setReason={setRejectReason}
          onClose={() => setRejectOpen(false)}
          onSubmit={reject}
        />
      </div>
    </SidebarLayout>
  );
}
