import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Mode = "login" | "register";

interface FormState {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s\-().]{7,15}$/;

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState<FormState>({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const set = (key: keyof FormState, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: "" }));
  };

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (mode === "register" && form.name.trim().length < 2) e.name = "Full name is required (min 2 chars)";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Please enter a valid email address";
    if (mode === "register" && !PHONE_RE.test(form.phone.trim())) e.phone = "Please enter a valid phone number (7–15 digits)";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email: form.email.trim(), password: form.password });
      } else {
        await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password });
      }
      toast.success(mode === "login" ? "Welcome back!" : "Account created!");
      navigate("/");
    } catch (err: any) {
      const msg = err?.response?.data?.message || (mode === "login" ? "Invalid credentials" : "Registration failed");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const FieldErr = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{ width: `${120 + i * 80}px`, height: `${120 + i * 80}px`, top: "50%", left: "50%",
                transform: "translate(-50%, -50%)", opacity: 1 - i * 0.15 }} />
          ))}
        </div>
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">BookEase</h1>
          <p className="text-white/70 text-lg max-w-sm">
            Premium appointment booking platform. Effortless scheduling, real-time availability.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[["500+", "Happy Clients"], ["50+", "Services"], ["99%", "Satisfaction"]].map(([v, l]) => (
              <div key={l} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{v}</div>
                <div className="text-xs text-white/60 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8">
            <div className="flex lg:hidden items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-foreground text-lg">BookEase</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {mode === "login" ? "Sign in to manage your bookings." : "Join thousands of happy customers."}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            {(["login", "register"] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setErrors({}); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                  ${mode === m ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground"}`}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === "register" && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Priya Sharma" value={form.name}
                  onChange={e => set("name", e.target.value)}
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""} />
                <FieldErr msg={errors.name} />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => set("email", e.target.value)}
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""} />
              <FieldErr msg={errors.email} />
            </div>
            {mode === "register" && (
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+91 98765 43210" value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  className={errors.phone ? "border-destructive focus-visible:ring-destructive" : ""} />
                <FieldErr msg={errors.phone} />
              </div>
            )}
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPass ? "text" : "password"} placeholder="••••••••"
                  value={form.password} onChange={e => set("password", e.target.value)}
                  className={`pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`} />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldErr msg={errors.password} />
            </div>

            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground h-11 font-semibold shadow-elevated mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setErrors({}); }}
              className="text-primary font-semibold hover:underline">
              {mode === "login" ? "Sign up free" : "Sign in"}
            </button>
          </p>

          {mode === "login" && (
            <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
              <strong>Demo:</strong> admin@bookease.com / Admin@123 &nbsp;·&nbsp; or register a new account
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
