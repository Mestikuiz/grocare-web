import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Phone, Shield, Loader2, ChevronRight, CheckCircle } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { isLoggedIn, login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from: string = (location.state as any)?.from ?? "/profile";

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) navigate(from, { replace: true });
  }, [isLoggedIn]);

  const [phone,     setPhone]     = useState("");
  const [otp,       setOtp]       = useState(["", "", "", ""]);
  const [sent,      setSent]      = useState(false);
  const [devOtp,    setDevOtp]    = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoVerifyRef = useRef(false);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(timerRef.current!); return 0; }
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [countdown]);

  useEffect(() => {
    if (sent && !loading && !autoVerifyRef.current && otp.every(d => d !== "") && otp.join("").length === 4) {
      autoVerifyRef.current = true;
      verify();
    }
  }, [otp, sent, loading]);

  const sendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/send-otp", { phone: phone.trim() });
      setSent(true);
      setCountdown(60);
      if (res.data?.otp) {
        setDevOtp(res.data.otp as string);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next  = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 3) inputRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4).split("");
    if (digits.length) {
      setOtp(prev => {
        const next = [...prev];
        digits.forEach((d, i) => { next[i] = d; });
        return next;
      });
      const lastFilled = Math.min(digits.length, 3);
      setTimeout(() => inputRefs.current[lastFilled]?.focus(), 0);
    }
    e.preventDefault();
  };

  const verify = async () => {
    const code = otp.join("");
    if (code.length < 4) { setError("Enter the 4-digit OTP."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { phone: phone.trim(), code });
      const token = res.data?.token ?? res.data?.access_token;
      const user  = res.data?.user;
      if (token && user) login(token, user);
      navigate(from, { replace: true });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resend = () => {
    setOtp(["", "", "", ""]);
    setDevOtp(null);
    setError("");
    autoVerifyRef.current = false;
    sendOtp();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-8">

          {/* Logo + title */}
          <div className="text-center mb-8">
            <Link to="/">
              <img src="/logo.png" alt="Grocare" className="h-10 mx-auto mb-4 object-contain" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {sent ? "Verify OTP" : "Login / Sign up"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {sent
                ? `Code sent to ${phone}`
                : "Enter your phone number to continue"}
            </p>
          </div>

          {!sent ? (
            /* ── Phone step ─────────────────────────────────────────────── */
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Mobile Number
                </label>
                <div className="flex">
                  <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500 font-medium">
                    🇵🇰 +92
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && sendOtp()}
                    placeholder="3XXXXXXXXX"
                    maxLength={11}
                    autoFocus
                    className="flex-1 border border-gray-200 rounded-r-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]/30 focus:border-[#2382AA]"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  e.g. 03001234567 or 3001234567
                </p>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                onClick={sendOtp}
                disabled={loading || !phone.trim()}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-50"
                style={{ background: "#2382AA" }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />}
                Send OTP
              </button>

              <p className="text-center text-xs text-gray-400">
                By continuing, you agree to our{" "}
                <span className="text-[#2382AA] cursor-pointer hover:underline">Terms of Service</span>
              </p>
            </div>
          ) : (
            /* ── OTP step ───────────────────────────────────────────────── */
            <div className="space-y-5">
              {devOtp && (
                <div className="w-full bg-blue-50 border-2 border-[#2382AA]/40 rounded-xl px-4 py-4 text-center">
                  <p className="text-xs text-[#2382AA] font-semibold mb-2 uppercase tracking-wide">Your verification code</p>
                  <p className="text-4xl font-black tracking-[0.4em] text-[#2382AA]">{devOtp}</p>
                  <p className="text-[11px] text-gray-400 mt-2">Enter this code in the boxes below</p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block text-center">
                  Enter 4-digit code
                </label>
                <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      autoFocus={i === 0}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-14 h-16 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none transition-all"
                      style={{ borderColor: d ? "#2382AA" : undefined, color: d ? "#2382AA" : undefined }}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg text-center">{error}</p>
              )}

              <button
                onClick={verify}
                disabled={loading || otp.join("").length < 4}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-50"
                style={{ background: "#2382AA" }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Verify & Login
              </button>

              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={() => { setSent(false); setOtp(["","","",""]); setDevOtp(null); setError(""); autoVerifyRef.current = false; }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Change number
                </button>
                {countdown > 0 ? (
                  <span className="text-gray-400">Resend in {countdown}s</span>
                ) : (
                  <button onClick={resend} className="text-[#2382AA] hover:underline font-medium">
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Back to home */}
        <p className="text-center mt-4 text-xs text-gray-400">
          <Link to="/" className="hover:text-[#2382AA] flex items-center justify-center gap-1">
            <ChevronRight size={11} className="rotate-180" /> Back to home
          </Link>
        </p>

      </div>
    </div>
  );
}
