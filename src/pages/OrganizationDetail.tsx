import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarLayout, { SidebarIcons } from '@/components/layout/SidebarLayout';
import { adminOrgsApi, orgsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import RejectOrgDialog from '@/features/admin-panel/components/RejectOrgDialog';

type OrgData = {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  verified: boolean;
  rejectionReason?: string;
  ownerName?: string;
};

export default function OrganizationDetailPage() {
  const { id } = useParams();
  const orgId = Number(id);
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const basePath = hasRole('SUPER_ADMIN') ? '/super-admin' : '/admin';
  const panelLabel = hasRole('SUPER_ADMIN') ? 'Super Admin' : 'Admin';

  const sidebarItems = [
    { label: `${panelLabel} panel`, to: basePath, icon: SidebarIcons.Admin },
    { label: 'Kalendar', to: `${basePath}/calendar`, icon: SidebarIcons.Calendar },
    { label: 'Tadbirlar', to: '/events', icon: SidebarIcons.Dashboard },
    { label: 'Bosh sahifa', to: '/', icon: SidebarIcons.Home },
  ];

  const [org, setOrg] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!user || (!hasRole('ADMIN') && !hasRole('SUPER_ADMIN'))) {
      navigate('/login');
      return;
    }
    if (!orgId) {
      toast.error('Organization ID noto‘g‘ri');
      navigate(basePath);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const res = await orgsApi.getById(orgId);
        setOrg(res.data);
      } catch {
        toast.error("Tashkilot ma'lumotlarini yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, hasRole, navigate, orgId, basePath]);

  if (loading) {
    return (
      <SidebarLayout title={panelLabel} items={sidebarItems}>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      </SidebarLayout>
    );
  }

  if (!org) {
    return (
      <SidebarLayout title={panelLabel} items={sidebarItems}>
        <div className="p-6">
          <p className="text-sm text-gray-600">Tashkilot topilmadi.</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate(basePath)}>
            Orqaga
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  const reload = async () => {
    try {
      const res = await orgsApi.getById(orgId);
      setOrg(res.data);
    } catch {
      toast.error("Tashkilot ma'lumotlarini yangilashda xatolik");
    }
  };

  const approve = async () => {
    try {
      await adminOrgsApi.approve(orgId);
      toast.success('Tashkilot tasdiqlandi!');
      await reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik');
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Sabab kiriting');
      return;
    }
    try {
      await adminOrgsApi.reject(orgId, rejectReason);
      toast.success('Tashkilot rad etildi');
      setRejectOpen(false);
      setRejectReason('');
      await reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik');
    }
  };

  return (
    <SidebarLayout title={panelLabel} items={sidebarItems}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{org.name}</h1>
            <div className="mt-2 flex gap-2 flex-wrap">
              {org.verified ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Tasdiqlangan</Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  Kutilmoqda
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {!org.verified ? (
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
            <CardTitle>Tashkilot ma&apos;lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-gray-500">Tavsif</p>
              <p className="text-sm text-gray-900 whitespace-pre-line">{org.description || '-'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Manzil</p>
                <p className="text-sm text-gray-900">{org.address || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Telefon</p>
                <p className="text-sm text-gray-900">{org.phone || '-'}</p>
              </div>
            </div>

            {org.ownerName ? (
              <div>
                <p className="text-xs text-gray-500">Egasi</p>
                <p className="text-sm text-gray-900">{org.ownerName}</p>
              </div>
            ) : null}

            {org.rejectionReason ? (
              <div>
                <p className="text-xs text-red-500">Rad sababi</p>
                <p className="text-sm text-red-700 whitespace-pre-line">{org.rejectionReason}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <RejectOrgDialog
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
