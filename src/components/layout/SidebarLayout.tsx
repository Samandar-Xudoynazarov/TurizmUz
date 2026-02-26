import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Home, LayoutDashboard, Shield, User, Building2, LogOut, Hotel } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type NavItem = { label: string; to: string; icon: ReactNode };

type Props = {
  title: string;
  items: NavItem[];
  children: ReactNode;
};

function normalizeUrl(u: string) {
  // "path?x=1" -> { path, search }
  const [path, search = ""] = u.split("?");
  return { path, search: search ? `?${search}` : "" };
}

export default function SidebarLayout({ title, items, children }: Props) {
  const loc = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-4 lg:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-6 h-fit">
            <Card className="rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-indigo-600 flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-slate-500">Panel</div>
                  <div className="font-semibold text-slate-900 truncate">{title}</div>
                </div>
              </div>

              <Separator className="my-4" />

              <nav className="space-y-1">
                {items.map((it) => {
                  const itNorm = normalizeUrl(it.to);
                  const locNorm = { path: loc.pathname, search: loc.search || "" };

                  // 1) oddiy linklar uchun
                  const pathMatch =
                    locNorm.path === itNorm.path || locNorm.path.startsWith(itNorm.path + "/");

                  // 2) agar item query bilan bo'lsa, search ham match bo'lsin
                  const queryMatch = itNorm.search ? locNorm.search === itNorm.search : true;

                  const active = pathMatch && queryMatch;

                  return (
                    <Link key={it.to} to={it.to} className="block">
                      <Button
                        variant={active ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-2 rounded-xl",
                          active && "bg-indigo-600 hover:bg-indigo-700"
                        )}
                      >
                        <span className="shrink-0">{it.icon}</span>
                        <span className="truncate">{it.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </nav>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Link to="/profile">
                  <Button variant="ghost" className="w-full justify-start gap-2 rounded-xl">
                    <User className="h-4 w-4" /> Profil
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 rounded-xl text-red-600 hover:text-red-600"
                  onClick={() => logout()}
                >
                  <LogOut className="h-4 w-4" /> Chiqish
                </Button>

                <div className="text-xs text-slate-500 pt-1">
                  {user?.email ? <span className="truncate block">Kirish: {user.email}</span> : null}
                </div>
              </div>
            </Card>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

export const SidebarIcons = {
  Home: <Home className="h-4 w-4" />,
  Dashboard: <LayoutDashboard className="h-4 w-4" />,
  Admin: <Shield className="h-4 w-4" />,
  Org: <Building2 className="h-4 w-4" />,
  Calendar: <CalendarDays className="h-4 w-4" />,
  Users: <User className="h-4 w-4" />,
  Accommodations: <Hotel className="h-4 w-4" />,
};