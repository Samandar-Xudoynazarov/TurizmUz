import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload, CalendarDays } from "lucide-react";
import { parseLatLngFromLink } from "@/lib/geo";

/**
 * datetime-local => "YYYY-MM-DDTHH:mm" (yoki ba'zida sekund bilan)
 * Backend kutyapti => "YYYY-MM-DDTHH:mm:ss"
 */
function normalizeToIsoNoTZ(dtLocal: string) {
  const v = (dtLocal || "").trim();
  if (!v) return "";

  // Agar sekund yo'q bo'lsa, qo'shamiz
  // "2026-03-01T18:30" -> "2026-03-01T18:30:00"
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return `${v}:00`;

  // Agar sekund bor bo'lsa (HH:mm:ss) shu holicha
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(v)) return v;

  // Boshqa format bo'lsa ham backendga yubormaymiz
  return "";
}

/**
 * Backendga yuboriladigan ISO ko'rinish (sekund bilan).
 * UI input esa datetime-local formatda saqlanadi.
 */
export default function CreateEventDialog({
  disabled,
  organizationId,
  onCreate,
}: {
  disabled: boolean;
  organizationId: number;
  onCreate: (payload: {
    title: string;
    description: string;
    locationName: string;
    latitude: number;
    longitude: number;
    eventDateTime: string; // "YYYY-MM-DDTHH:mm:ss"
    organizationId: number;
    files: File[];
  }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    locationName: "",
    locationLink: "",
    latitude: "",
    longitude: "",
    // UI uchun: datetime-local format ("YYYY-MM-DDTHH:mm")
    eventDateTimeLocal: "",
  });

  const eventDateTimeIso = useMemo(() => {
    return normalizeToIsoNoTZ(form.eventDateTimeLocal);
  }, [form.eventDateTimeLocal]);

  const canSubmit = useMemo(() => {
    return (
      form.title.trim() &&
      form.description.trim() &&
      form.locationName.trim() &&
      form.latitude.trim() &&
      form.longitude.trim() &&
      eventDateTimeIso.trim() &&
      organizationId > 0
    );
  }, [form, organizationId, eventDateTimeIso]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (disabled) {
      toast.error("Tashkilot tasdiqlanmagan. Tadbir yaratib bo‘lmaydi.");
      return;
    }
    if (files.length < 1) {
      toast.error("Kamida 1 ta rasm yuklang");
      return;
    }
    if (!eventDateTimeIso) {
      toast.error("Sana/vaqtni kalendardan tanlang");
      return;
    }

    setSubmitting(true);
    try {
      await onCreate({
        title: form.title.trim(),
        description: form.description.trim(),
        locationName: form.locationName.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        eventDateTime: eventDateTimeIso, // ✅ backend format
        organizationId,
        files,
      });

      setOpen(false);
      setForm({
        title: "",
        description: "",
        locationName: "",
        locationLink: "",
        latitude: "",
        longitude: "",
        eventDateTimeLocal: "",
      });
      setFiles([]);
    } finally {
      setSubmitting(false);
    }
    console.log("SENDING organizationId:", organizationId);
    console.log("TOKEN:", localStorage.getItem("accessToken")?.slice(0, 20));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={organizationId <= 0} className="gap-2">
          <Plus className="w-4 h-4" /> Tadbir yaratish
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100vw-24px)] sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yangi tadbir</DialogTitle>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label>Sarlavha</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Tavsif</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Joy nomi</Label>
                <Input
                  value={form.locationName}
                  onChange={(e) =>
                    setForm({ ...form, locationName: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Joylashuv linki (Google/Yandex)</Label>
                <Input
                  placeholder="Masalan: https://www.google.com/maps/@39.6542,66.9597,16z"
                  value={form.locationLink}
                  onChange={(e) => {
                    const v = e.target.value;
                    const parsed = parseLatLngFromLink(v);
                    if (parsed) {
                      setForm({
                        ...form,
                        locationLink: v,
                        latitude: String(parsed.lat),
                        longitude: String(parsed.lng),
                      });
                    } else {
                      setForm({ ...form, locationLink: v });
                    }
                  }}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Linkni paste qilsangiz latitude/longitude avtomatik to‘ladi.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitude</Label>
                  <Input
                    value={form.latitude}
                    onChange={(e) =>
                      setForm({ ...form, latitude: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input
                    value={form.longitude}
                    onChange={(e) =>
                      setForm({ ...form, longitude: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* ✅ KALENDAR + VAQT */}
              <div>
                <Label className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" /> Sana va vaqt
                </Label>

                <Input
                  type="datetime-local"
                  value={form.eventDateTimeLocal}
                  onChange={(e) =>
                    setForm({ ...form, eventDateTimeLocal: e.target.value })
                  }
                  required
                />

                <div className="text-xs text-muted-foreground mt-1">
                  Backendga yuboriladi:{" "}
                  <span className="font-mono">{eventDateTimeIso || "—"}</span>
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Rasmlar
                </Label>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Event yaratish multipart/form-data orqali yuboriladi.
                </div>
              </div>

              <Button
                type="submit"
                disabled={!canSubmit || submitting}
                className="w-full"
              >
                {submitting ? "Yuborilmoqda..." : "Yaratish"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
