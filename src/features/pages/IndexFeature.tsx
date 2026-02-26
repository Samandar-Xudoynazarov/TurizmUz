import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { eventsApi, orgsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  MapPin,
  ArrowRight,
  Building2,
  Users,
  LogIn,
  LogOut,
  LayoutDashboard,
  ChevronRight,
  Clock,
  ChevronLeft,
  ChevronUp,
} from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
} from "date-fns";

const HERO_IMAGES = [
  "https://mgx-backend-cdn.metadl.com/generate/images/974027/2026-02-17/0c8d852c-4504-4c48-9a83-24ddfcddba1e.png",
  "https://mgx-backend-cdn.metadl.com/generate/images/974027/2026-02-17/e0c7e48e-99b5-4b4c-a900-7b1b8469db11.png",
  "https://mgx-backend-cdn.metadl.com/generate/images/974027/2026-02-17/f5c79a7d-cee0-4f9b-ba30-99c431dc4477.png",
  "https://mgx-backend-cdn.metadl.com/generate/images/974027/2026-02-17/04d1694e-45ce-4c8d-a79c-ecbeb9dd7a49.png",
];

interface EventItem {
  id: number;
  title: string;
  description: string;
  locationName: string;
  eventDateTime: string;
  organizationName?: string;
  status?: string;
  approved?: boolean;
  published?: boolean;
}

interface OrgItem {
  id: number;
  name: string;
  description: string;
  address: string;
}

function getEventVisibilityLabel(ev: EventItem) {
  const status = String(ev.status || "").toUpperCase();
  if (status) return status;
  if (ev.approved === true) return "APPROVED";
  if (ev.published === true) return "PUBLISHED";
  return "";
}

function clampText(s: string, n: number) {
  const t = String(s || "");
  return t.length > n ? t.slice(0, n).trim() + "…" : t;
}

/** ✅ Yaxshilangan mini kalendar (month + week view, Today tugmasi, indicatorlar) */
function MiniCalendar({ events }: { events: EventItem[] }) {
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mode, setMode] = useState<"MONTH" | "WEEK">("MONTH");

  const WEEKDAYS = ["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"];

  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);

  // Month grid uchun
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart); // 0=Yakshanba ... 6=Shanba
  const emptyCount = startDay === 0 ? 6 : startDay - 1;

  // Week view uchun
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const eventsByDayKey = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of events) {
      const d = new Date(e.eventDateTime);
      const key = format(d, "yyyy-MM-dd");
      const arr = map.get(key) || [];
      arr.push(e);
      map.set(key, arr);
    }
    // sort each day by time
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => +new Date(a.eventDateTime) - +new Date(b.eventDateTime));
      map.set(k, arr);
    }
    return map;
  }, [events]);

  const selectedDayEvents = useMemo(() => {
    const key = format(selectedDate, "yyyy-MM-dd");
    return eventsByDayKey.get(key) || [];
  }, [eventsByDayKey, selectedDate]);

  const renderDayCell = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    const dayEvents = eventsByDayKey.get(key) || [];
    const isToday = isSameDay(day, new Date());
    const isSelected = isSameDay(day, selectedDate);
    const inMonth = isSameMonth(day, calMonth);

    return (
      <button
        type="button"
        key={day.toISOString()}
        onClick={() => setSelectedDate(day)}
        className={[
          "relative min-h-[86px] p-2 rounded-xl border text-left text-xs transition",
          "hover:border-indigo-200 hover:shadow-sm",
          isSelected ? "border-indigo-500 bg-indigo-50" : "border-gray-100 bg-white",
          isToday && !isSelected ? "ring-1 ring-indigo-200" : "",
          !inMonth ? "opacity-50" : "",
        ].join(" ")}
      >
        <div className="flex items-center justify-between">
          <span className={["font-semibold", isToday ? "text-indigo-700" : "text-gray-800"].join(" ")}>
            {format(day, "d")}
          </span>

          {dayEvents.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span className="text-[10px] text-gray-500">{dayEvents.length}</span>
            </span>
          ) : null}
        </div>

        {dayEvents.slice(0, 2).map((ev) => (
          <div
            key={ev.id}
            className="mt-1 bg-indigo-100 text-indigo-700 rounded-lg px-2 py-1 truncate"
            title={ev.title}
          >
            {clampText(ev.title, 18)}
          </div>
        ))}

        {dayEvents.length > 2 ? (
          <div className="mt-1 text-[10px] text-gray-400">+{dayEvents.length - 2} ta</div>
        ) : null}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="border-0 shadow-sm lg:col-span-2 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
                Kalendar
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Kunni bosing — o‘sha kundagi tadbirlar o‘ng tomonda chiqadi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const t = new Date();
                  setCalMonth(t);
                  setSelectedDate(t);
                }}
              >
                Bugun
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  mode === "MONTH"
                    ? setCalMonth(subMonths(calMonth, 1))
                    : setSelectedDate(addDays(selectedDate, -7))
                }
                aria-label="Oldingi"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="min-w-[140px] text-center">
                <div className="text-sm font-semibold text-gray-900">
                  {mode === "MONTH"
                    ? format(calMonth, "MMMM yyyy")
                    : `${format(weekStart, "dd MMM")} — ${format(weekEnd, "dd MMM")}`}
                </div>
                <button
                  type="button"
                  className="mt-1 inline-flex items-center justify-center gap-1 text-[11px] text-indigo-600 hover:underline"
                  onClick={() => setMode((m) => (m === "MONTH" ? "WEEK" : "MONTH"))}
                >
                  {mode === "MONTH" ? "Haftalik ko‘rinish" : "Oylik ko‘rinish"}
                  <ChevronUp className={["w-3 h-3 transition", mode === "MONTH" ? "rotate-180" : ""].join(" ")} />
                </button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  mode === "MONTH"
                    ? setCalMonth(addMonths(calMonth, 1))
                    : setSelectedDate(addDays(selectedDate, 7))
                }
                aria-label="Keyingi"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400">
                {d}
              </div>
            ))}
          </div>

          {/* Month / Week */}
          {mode === "MONTH" ? (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: emptyCount }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {monthDays.map(renderDayCell)}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">{weekDays.map(renderDayCell)}</div>
          )}
        </CardContent>
      </Card>

      {/* Right list */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Eslatma</CardTitle>
          <p className="text-sm text-gray-500">{format(selectedDate, "dd MMMM yyyy")}</p>
        </CardHeader>

        <CardContent className="space-y-3 max-h-[560px] overflow-auto pr-1">
          {selectedDayEvents.length === 0 ? (
            <div className="text-sm text-gray-500">Bu kunda tadbir yo‘q.</div>
          ) : (
            selectedDayEvents.map((ev) => {
              const vis = getEventVisibilityLabel(ev);
              return (
                <Link
                  to={`/events/${ev.id}`}
                  key={ev.id}
                  className="block rounded-2xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm transition"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{ev.title}</div>
                        <div className="mt-2 flex flex-col gap-1 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(ev.eventDateTime), "HH:mm")}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {ev.locationName}
                          </span>
                        </div>
                      </div>

                      {vis ? (
                        <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                          {vis}
                        </Badge>
                      ) : null}
                    </div>

                    {ev.organizationName ? (
                      <div className="mt-3 text-[11px] text-gray-400">{ev.organizationName}</div>
                    ) : null}
                  </div>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function IndexPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roles: string[] = useMemo(() => {
    const r: any = (user as any)?.roles;
    return Array.isArray(r) ? r.map(String) : [];
  }, [user]);

  useEffect(() => {
    eventsApi
      .getUpcoming()
      .then((r) => setEvents(r.data || []))
      .catch(() => {});

    orgsApi
      .getVerified()
      .then((r) => setOrgs(r.data?.slice?.(0, 4) || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const topEvents = useMemo(() => events?.slice?.(0, 6) || [], [events]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* ✅ LOGO: TourDay */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-extrabold text-gray-900">TourDay</div>
              <div className="text-[11px] text-gray-500 -mt-0.5">events & tours</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/events">
              <Button variant="ghost" size="sm">
                Tadbirlar
              </Button>
            </Link>

            {/* ✅ KALENDAR ICON -> MODAL */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full"
                  aria-label="Kalendarni ochish"
                >
                  <CalendarDays className="w-5 h-5" />
                  {events.length > 0 ? (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center">
                      {events.length > 99 ? "99+" : events.length}
                    </span>
                  ) : null}
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-6xl">
                <DialogHeader>
                  <DialogTitle>Kalendar</DialogTitle>
                </DialogHeader>
                <MiniCalendar events={events} />
              </DialogContent>
            </Dialog>

            {user ? (
              <>
                {(roles.includes("ADMIN") || roles.includes("SUPER_ADMIN")) && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">
                      <LayoutDashboard className="w-4 h-4 mr-1" />
                      Admin
                    </Button>
                  </Link>
                )}

                {roles.includes("TOUR_ORGANIZATION") && (
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm">
                      <Building2 className="w-4 h-4 mr-1" />
                      Dashboard
                    </Button>
                  </Link>
                )}

                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    Profil
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Chiqish
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  <LogIn className="w-4 h-4 mr-1" />
                  Kirish
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-[520px] overflow-hidden">
        {HERO_IMAGES.map((img, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === heroIdx ? 1 : 0 }}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-white/80 text-xs border border-white/10">
              <CalendarDays className="w-4 h-4" />
              Eng so‘nggi tadbirlar va sayohatlar
            </div>

            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold text-white leading-tight">
              Eng yaxshi tadbirlarni{" "}
              <span className="text-amber-300">kashf eting</span>
            </h1>

            <p className="mt-4 text-lg text-gray-200">
              Konferensiyalar, festivallar, konsertlar va tabiat sayohatlari — barchasi bir joyda.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/events">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Tadbirlar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>

              {!user && (
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="!bg-transparent border-white/70 text-white !hover:bg-white/10"
                  >
                    Ro&apos;yxatdan o&apos;tish
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Hero dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              className={[
                "h-2.5 rounded-full transition-all",
                i === heroIdx ? "bg-white w-9" : "bg-white/50 w-2.5",
              ].join(" ")}
              aria-label={`Hero ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Yaqinlashayotgan tadbirlar</h2>
            <p className="text-gray-500 mt-1">Eng so&apos;nggi va qiziqarli tadbirlar</p>
          </div>

          <Link
            to="/events"
            className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
          >
            Barchasi <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {topEvents.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Hozircha tadbirlar yo&apos;q</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topEvents.map((event) => (
              <Link to={`/events/${event.id}`} key={event.id} className="group">
                <Card className="border-0 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-44">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600" />
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <Badge className="bg-white/15 text-white border border-white/10">
                        {format(new Date(event.eventDateTime), "dd MMM")}
                      </Badge>
                      <Badge className="bg-white/15 text-white border border-white/10">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {format(new Date(event.eventDateTime), "HH:mm")}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {event.title}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{event.locationName}</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {event.organizationName ? event.organizationName : "—"}
                      </span>
                      <span className="text-indigo-600 text-sm font-semibold inline-flex items-center gap-1">
                        Ko‘rish <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Hotels / Hostels CTA
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="relative overflow-hidden rounded-3xl shadow-sm border bg-black">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80"
            className="absolute inset-0 h-full w-full object-cover opacity-75"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />

          <div className="relative p-8 md:p-10 flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-white/80 text-xs border border-white/10 w-fit">
              <MapPin className="w-4 h-4" />
              Turar joylar bo‘limi
            </div>

            <h2 className="text-3xl font-extrabold text-white">Hotel / Hostel</h2>
            <p className="text-white/70 max-w-xl">
              Ko‘rish va batafsil ma’lumotlar — eng qulay va chiroyli joylarni toping.
            </p>

            <Button
              className="w-fit bg-white text-black hover:bg-white/90"
              onClick={() => {
                if (user) navigate("/hotels-hostels");
                else navigate("/login?next=/hotels-hostels");
              }}
            >
              Public sahifa
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section> */}

      {/* Verified Organizations */}
      <section className="bg-white py-16 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900">Tasdiqlangan tashkilotlar</h2>
            <p className="text-gray-500 mt-1">Ishonchli va tekshirilgan tashkilotlar</p>
          </div>

          {orgs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Hozircha tashkilotlar yo&apos;q</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {orgs.map((org) => (
                <Card
                  key={org.id}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow rounded-2xl"
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-7 h-7 text-indigo-600" />
                    </div>
                    <h3 className="font-bold text-gray-900">{org.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {org.description}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-3 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />
                      {org.address}
                    </div>
                    <Badge className="mt-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      Tasdiqlangan
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-3xl font-extrabold text-gray-900">{events.length}+</h3>
            <p className="text-gray-500 mt-1">Faol tadbirlar</p>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-3xl font-extrabold text-gray-900">{orgs.length}+</h3>
            <p className="text-gray-500 mt-1">Tashkilotlar</p>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-3xl font-extrabold text-gray-900">100+</h3>
            <p className="text-gray-500 mt-1">Foydalanuvchilar</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-extrabold text-white">TourDay</span>
          </div>
          <p className="text-sm">© 2026 TourDay. Barcha huquqlar himoyalangan.</p>
        </div>
      </footer>
    </div>
  );
}