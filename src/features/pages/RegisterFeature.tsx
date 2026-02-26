import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usersApi } from "@/lib/api";
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
import { CalendarDays, UserPlus, LogIn, ShieldCheck, RotateCcw } from "lucide-react";

type Step = "REGISTER" | "VERIFY";

export default function RegisterPage() {
  const navigate = useNavigate();

  // ✅ verifyRegister + user ni ham olamiz
  const { user, verifyRegister, getRedirectPath } = useAuth();

  const [step, setStep] = useState<Step>("REGISTER");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Uzbekistan");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  // ✅ user set bo‘lgandan keyin role bo‘yicha routing (100% to‘g‘ri)
  useEffect(() => {
    if (user) {
      navigate(getRedirectPath(), { replace: true });
    }
  }, [user, navigate, getRedirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      if (step === "REGISTER") {
        if (!fullName.trim() || !normalizedEmail) {
          toast.error("Ism-familiya va email majburiy");
          return;
        }

        await usersApi.createViaRegister({
          fullName: fullName.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          country: country.trim(),
        });

        toast.message("Emailga tasdiqlash kodi yuborildi. Gmailni tekshiring.");
        setStep("VERIFY");
      } else {
        if (!code.trim()) {
          toast.error("Kod majburiy");
          return;
        }

        // ✅ register verify endpoint (token qaytadi)
        await verifyRegister(normalizedEmail, code.trim());

        toast.success("Ro'yxatdan o'tish tasdiqlandi!");
        // ❌ navigate bu yerda EMAS (user set bo‘lgach useEffect redirect qiladi)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Ro'yxatdan o'tishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (loading) return;

    if (!fullName.trim() || !normalizedEmail) {
      toast.error("Ism-familiya va email kerak");
      return;
    }

    setLoading(true);
    try {
      // /auth/register qayta chaqirilsa kod qayta yuboriladi
      await usersApi.createViaRegister({
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        country: country.trim(),
      });

      toast.success("Kod qayta yuborildi");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Kod yuborishda xatolik");
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
          <h1 className="text-3xl font-bold text-gray-900">
            {step === "REGISTER" ? "Ro'yxatdan o'tish" : "Email tasdiqlash"}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === "REGISTER"
              ? "Yangi akkaunt yarating"
              : "Gmailga kelgan kodni kiriting"}
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold">
              Yangi foydalanuvchi
            </CardTitle>
            <CardDescription>Ma'lumotlarni to'ldiring</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === "REGISTER" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Ism-familiya</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ali Valiyev"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ali@gmail.com"
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="99890..."
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Mamlakat</Label>
                      <Input
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700"
                    disabled={loading}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {loading ? "Yuborilmoqda..." : "Davom etish"}
                  </Button>

                  <div className="text-center text-sm text-gray-600">
                    Akkauntingiz bormi?{" "}
                    <Link
                      to="/login"
                      className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                    >
                      <LogIn className="h-4 w-4" /> Kirish
                    </Link>
                  </div>
                </>
              ) : (
                <>
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
                          setStep("REGISTER");
                          setCode("");
                        }}
                        className="hover:underline"
                        disabled={loading}
                      >
                        Orqaga
                      </button>

                      <button
                        type="button"
                        onClick={resend}
                        className="inline-flex items-center gap-1 hover:underline"
                        disabled={loading}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Kodni qayta yuborish
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700"
                    disabled={loading}
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    {loading ? "Tasdiqlanmoqda..." : "Tasdiqlash"}
                  </Button>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}