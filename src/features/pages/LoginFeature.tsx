import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CalendarDays,
  LogIn,
  UserPlus,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

type Step = "EMAIL" | "CODE";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("EMAIL");
  const [loading, setLoading] = useState(false);

  const { user, login, verify, getRedirectPath } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next"); // masalan: /hotels-hostels
  const normalizedEmail = email.trim().toLowerCase();

  // ✅ user set bo‘lgandan keyin role bo‘yicha routing
  useEffect(() => {
    if (!user) return;

    // ✅ next bo'lsa shu yerga qaytadi, bo'lmasa role bo'yicha
    const target = next && next.startsWith("/") ? next : getRedirectPath();
    navigate(target, { replace: true });
  }, [user, next, navigate, getRedirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!normalizedEmail) {
      toast.error("Email kiriting");
      return;
    }

    if (step === "CODE" && !code.trim()) {
      toast.error("Kod kiriting");
      return;
    }

    setLoading(true);
    try {
      if (step === "EMAIL") {
        await login(normalizedEmail);
        toast.message(
          "Agar kod kerak bo'lsa, emailga yuborildi. Gmailni tekshiring.",
        );
      } else {
        await verify(normalizedEmail, code.trim());
        toast.success("Tasdiqlandi!");
      }
    } catch (err: unknown) {
      const error = err as any;

      if (error?.needsVerification) {
        setStep("CODE");
        toast.message("Emailga tasdiqlash kodi yuborildi. Gmailni tekshiring.");
        return;
      }

      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Login xatolik yuz berdi";

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading) return;

    if (!normalizedEmail) {
      toast.error("Avval email kiriting");
      return;
    }

    setLoading(true);
    try {
      await login(normalizedEmail);
      toast.success("Kod qayta yuborildi");
    } catch (err: any) {
      if (err?.needsVerification) {
        setStep("CODE");
        toast.success("Kod qayta yuborildi");
      } else {
        toast.error(err?.response?.data?.message || "Kod yuborishda xatolik");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <CalendarDays className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">EventHub</h1>
          <p className="text-gray-500 mt-1">Tadbirlar platformasi</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Tizimga kirish</CardTitle>
            <CardDescription>
              {step === "EMAIL"
                ? "Email manzilingizni kiriting"
                : "Gmailga kelgan kodni kiriting"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  disabled={loading || step === "CODE"}
                />
              </div>

              {step === "CODE" && (
                <div className="space-y-2">
                  <Label htmlFor="code">Tasdiqlash kodi</Label>
                  <Input
                    id="code"
                    placeholder="Masalan: 123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="h-11"
                    autoFocus
                    disabled={loading}
                  />

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("EMAIL");
                        setCode("");
                      }}
                      className="hover:underline"
                      disabled={loading}
                    >
                      Emailni o'zgartirish
                    </button>

                    <button
                      type="button"
                      onClick={handleResend}
                      className="inline-flex items-center gap-1 hover:underline"
                      disabled={loading}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Kodni qayta yuborish
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  type="submit"
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading}
                >
                  {step === "EMAIL" ? (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      {loading ? "Tekshirilmoqda..." : "Davom etish"}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      {loading ? "Tasdiqlanmoqda..." : "Tasdiqlash"}
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => navigate("/register")}
                  disabled={loading}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ro'yxatdan o'tish
                </Button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium mb-2">
                Test akkauntlar:
              </p>
              <div className="space-y-1 text-xs text-gray-600">
                <p>
                  <span className="font-medium">Super Admin:</span>{" "}
                  asadbek@super.com
                </p>
                <p>
                  <span className="font-medium">Admin:</span> asadbek@admin.com
                </p>
                <p>
                  <span className="font-medium">User:</span> asadbek@user.com
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
