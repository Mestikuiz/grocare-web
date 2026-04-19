import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  ChevronRight, Phone, Shield, MapPin, Plus, CheckCircle,
  Loader2, Banknote, CreditCard, Smartphone, Wallet, X,
  ShoppingBag, Edit2, ChevronLeft, Lock, Package, Truck,
} from "lucide-react";
import { api, imgUrl } from "../../api/client";
import { useCart } from "../../context/CartContext";
import { useCity } from "../../context/CityContext";
import { useAuth } from "../../context/AuthContext";

// ── Constants ─────────────────────────────────────────────────────────────────
const DELIVERY_FEE         = 99;
const SERVICE_FEE          = 20;
const FREE_DELIVERY_AT     = 2500;

// ── Types ─────────────────────────────────────────────────────────────────────
interface Address {
  id: string;
  label?: string;
  fullAddress: string;
  area: string;
  city: string;
  isDefault?: boolean;
}

const PAYMENT_METHODS = [
  { value: "COD",       label: "Cash on Delivery",  icon: Banknote,    note: "Pay when your order arrives" },
  { value: "JAZZCASH",  label: "JazzCash",           icon: Smartphone,  note: "Pay via JazzCash mobile wallet" },
  { value: "EASYPAISA", label: "EasyPaisa",          icon: Smartphone,  note: "Pay via EasyPaisa account" },
  { value: "CARD",      label: "Debit / Credit Card",icon: CreditCard,  note: "Visa, Mastercard accepted" },
  { value: "WALLET",    label: "Grocare Wallet",     icon: Wallet,      note: "Use your wallet balance" },
];

// ── Step indicator ────────────────────────────────────────────────────────────
function Steps({ current }: { current: number }) {
  const steps = ["Login", "Address", "Payment"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${done   ? "bg-[#2382AA] border-[#2382AA] text-white"
                : active ? "border-[#2382AA] text-[#2382AA] bg-white"
                         : "border-gray-200 text-gray-400 bg-white"}`}>
                {done ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block
                ${active ? "text-[#2382AA]" : done ? "text-gray-700" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 rounded ${i < current ? "bg-[#2382AA]" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: OTP Login ─────────────────────────────────────────────────────────
function LoginStep({ onDone }: { onDone: () => void }) {
  const { login } = useAuth();
  const [phone,    setPhone]    = useState("");
  const [otp,      setOtp]      = useState(["", "", "", ""]);
  const [sent,     setSent]     = useState(false);
  const [devOtp,   setDevOtp]   = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [countdown,setCountdown]= useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(timerRef.current!); return 0; } return c - 1; }), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [countdown]);

  const sendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/send-otp", { phone: phone.trim() });
      setSent(true);
      setCountdown(60);
      if (res.data?.otp) setDevOtp(res.data.otp); // dev mode
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
    if (e.key === "Backspace" && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
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
      else if (token) localStorage.setItem("token", token);
      onDone();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: "#2382AA" }}>
          <Phone size={24} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{sent ? "Enter OTP" : "Login to Continue"}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {sent ? `We sent a 4-digit code to ${phone}` : "Enter your phone number to receive OTP"}
        </p>
      </div>

      {!sent ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">+92</span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendOtp()}
                placeholder="3XXXXXXXXX"
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]/30 focus:border-[#2382AA]"
                maxLength={11}
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={sendOtp}
            disabled={loading || !phone.trim()}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "#2382AA" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Send OTP
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {devOtp && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 flex items-center gap-1.5">
              <Shield size={13} />
              <span>Dev mode — OTP: <span className="font-bold tracking-widest">{devOtp}</span></span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block text-center">
              Enter 4-digit OTP
            </label>
            <div className="flex gap-3 justify-center">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-[#2382AA] transition-colors"
                  style={{ borderColor: d ? "#2382AA" : undefined }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <button
            onClick={verify}
            disabled={loading || otp.join("").length < 4}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "#2382AA" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Verify & Continue
          </button>

          <div className="text-center">
            <button
              onClick={() => { setSent(false); setOtp(["","","",""]); setDevOtp(null); setError(""); }}
              className="text-xs text-gray-500 hover:text-gray-700 mr-4"
            >
              ← Change number
            </button>
            {countdown > 0 ? (
              <span className="text-xs text-gray-400">Resend in {countdown}s</span>
            ) : (
              <button onClick={sendOtp} className="text-xs text-[#2382AA] hover:underline">
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 2: Address ───────────────────────────────────────────────────────────
function AddressStep({
  onSelect,
  selected,
}: {
  onSelect: (addr: Address) => void;
  selected: Address | null;
}) {
  const { selectedCity } = useCity();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [adding,    setAdding]    = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [form, setForm] = useState({
    label: "Home", fullAddress: "", area: "", city: selectedCity?.name ?? "",
  });

  useEffect(() => {
    api.get("/addresses")
      .then(r => {
        const data: Address[] = r.data?.data ?? r.data ?? [];
        setAddresses(data);
        const def = data.find(a => a.isDefault) ?? data[0];
        if (def && !selected) onSelect(def);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.fullAddress.trim() || !form.area.trim() || !form.city.trim()) {
      setError("Please fill in all required fields."); return;
    }
    setError(""); setSaving(true);
    try {
      const res = await api.post("/addresses", { ...form, isDefault: addresses.length === 0 });
      const newAddr: Address = res.data?.data ?? res.data;
      setAddresses(prev => [...prev, newAddr]);
      onSelect(newAddr);
      setAdding(false);
      setForm({ label: "Home", fullAddress: "", area: "", city: selectedCity?.name ?? "" });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading addresses…
      </div>
    );
  }

  const ADDRESS_LABELS = ["Home", "Work", "Other"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-bold text-gray-900">Delivery Address</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#2382AA] text-[#2382AA] hover:bg-[#2382AA]/5"
          >
            <Plus size={12} /> Add New
          </button>
        )}
      </div>

      {/* Existing addresses */}
      {addresses.map(addr => (
        <button
          key={addr.id}
          onClick={() => onSelect(addr)}
          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all
            ${selected?.id === addr.id
              ? "border-[#2382AA] bg-[#2382AA]/5"
              : "border-gray-200 hover:border-gray-300 bg-white"}`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
              ${selected?.id === addr.id ? "border-[#2382AA]" : "border-gray-300"}`}>
              {selected?.id === addr.id && (
                <div className="w-2 h-2 rounded-full" style={{ background: "#2382AA" }} />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{addr.label ?? "Address"}</span>
                {addr.isDefault && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2382AA]/10 text-[#2382AA] font-semibold">Default</span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                {addr.fullAddress}, {addr.area}, {addr.city}
              </p>
            </div>
          </div>
        </button>
      ))}

      {addresses.length === 0 && !adding && (
        <div className="text-center py-8 text-gray-500">
          <MapPin size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No addresses yet. Add one to continue.</p>
        </div>
      )}

      {/* Add new form */}
      {adding && (
        <div className="border-2 border-[#2382AA]/30 rounded-xl p-4 space-y-3 bg-[#2382AA]/5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-800">New Address</span>
            <button onClick={() => { setAdding(false); setError(""); }} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>

          {/* Label selector */}
          <div className="flex gap-2">
            {ADDRESS_LABELS.map(l => (
              <button
                key={l}
                onClick={() => setForm(f => ({ ...f, label: l }))}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors
                  ${form.label === l ? "border-[#2382AA] bg-[#2382AA] text-white" : "border-gray-200 text-gray-600 bg-white"}`}
              >
                {l}
              </button>
            ))}
          </div>

          <div>
            <label className="text-[11px] text-gray-500 uppercase tracking-wide font-medium">Full Address *</label>
            <input
              type="text"
              value={form.fullAddress}
              onChange={e => setForm(f => ({ ...f, fullAddress: e.target.value }))}
              placeholder="House / flat number, street name"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2382AA] bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-gray-500 uppercase tracking-wide font-medium">Area *</label>
              <input
                type="text"
                value={form.area}
                onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                placeholder="e.g. Gulshan-e-Iqbal"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2382AA] bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 uppercase tracking-wide font-medium">City *</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="e.g. Karachi"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2382AA] bg-white"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "#2382AA" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Address
          </button>
        </div>
      )}
    </div>
  );
}

// ── Step 3: Payment + Review ──────────────────────────────────────────────────
function PaymentStep({
  selectedAddress,
  promoCode,
  promoDiscount,
  onBack,
  onPlaced,
}: {
  selectedAddress: Address;
  promoCode: string;
  promoDiscount: number;
  onBack: () => void;
  onPlaced: (orderNumber: string) => void;
}) {
  const { items, total: cartTotal, clearCart } = useCart();
  const { selectedCity } = useCity();
  const [method,  setMethod]  = useState("COD");
  const [notes,   setNotes]   = useState("");
  const [placing, setPlacing] = useState(false);
  const [error,   setError]   = useState("");

  const freeDelivery = cartTotal >= FREE_DELIVERY_AT;
  const delivery     = freeDelivery ? 0 : DELIVERY_FEE;
  const estimatedTotal = cartTotal - promoDiscount + delivery + SERVICE_FEE;

  const handlePlace = async () => {
    setError(""); setPlacing(true);
    try {
      // 1. Sync localStorage cart → server
      const mergeItems = items.map(i => ({ productId: i.id, quantity: i.qty }));
      await api.post("/cart/merge", { items: mergeItems });

      // 2. Place order
      const res = await api.post("/orders", {
        addressId:     selectedAddress.id,
        paymentMethod: method,
        promoCode:     promoCode || undefined,
        notes:         notes || undefined,
        cityId:        selectedCity?.id,
      });

      const order = res.data?.data ?? res.data;
      clearCart();
      onPlaced(order.orderNumber ?? order.id);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Failed to place order. Try again."));
      setPlacing(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-gray-900">Payment Method</h2>

      {/* Payment selector */}
      <div className="space-y-2">
        {PAYMENT_METHODS.map(pm => {
          const Icon = pm.icon;
          return (
            <button
              key={pm.value}
              onClick={() => setMethod(pm.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                ${method === pm.value ? "border-[#2382AA] bg-[#2382AA]/5" : "border-gray-200 hover:border-gray-300 bg-white"}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                ${method === pm.value ? "border-[#2382AA]" : "border-gray-300"}`}>
                {method === pm.value && <div className="w-2 h-2 rounded-full" style={{ background: "#2382AA" }} />}
              </div>
              <Icon size={16} className={method === pm.value ? "text-[#2382AA]" : "text-gray-500"} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${method === pm.value ? "text-[#2382AA]" : "text-gray-800"}`}>
                  {pm.label}
                </p>
                <p className="text-[11px] text-gray-400">{pm.note}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Delivery address summary */}
      <div className="bg-gray-50 rounded-xl px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-[#2382AA] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gray-700">{selectedAddress.label ?? "Address"}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedAddress.fullAddress}, {selectedAddress.area}, {selectedAddress.city}
              </p>
            </div>
          </div>
          <button onClick={onBack} className="text-[10px] text-[#2382AA] hover:underline flex-shrink-0">
            Change
          </button>
        </div>
      </div>

      {/* Order notes */}
      <div>
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
          Order Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. please knock, leave at door, building code…"
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2382AA]/30 focus:border-[#2382AA]"
        />
      </div>

      {/* Price breakdown */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({items.reduce((s,i) => s + i.qty, 0)} items)</span>
          <span className="font-medium text-gray-800">Rs. {cartTotal.toLocaleString("en-PK")}</span>
        </div>
        {promoDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Promo ({promoCode})</span>
            <span className="font-medium">− Rs. {promoDiscount.toLocaleString("en-PK")}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Delivery fee</span>
          {freeDelivery
            ? <span className="text-green-600 font-medium">FREE</span>
            : <span className="font-medium text-gray-800">Rs. {DELIVERY_FEE.toLocaleString("en-PK")}</span>}
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Service fee</span>
          <span className="font-medium text-gray-800">Rs. {SERVICE_FEE.toLocaleString("en-PK")}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between">
          <span className="font-bold text-gray-900">Total (est.)</span>
          <span className="text-base font-extrabold" style={{ color: "#2382AA" }}>
            Rs. {estimatedTotal.toLocaleString("en-PK")}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-start gap-2">
          <X size={14} className="flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <button
        onClick={handlePlace}
        disabled={placing}
        className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity hover:opacity-85"
        style={{ background: "#2382AA" }}
      >
        {placing ? (
          <><Loader2 size={16} className="animate-spin" /> Placing Order…</>
        ) : (
          <><ShoppingBag size={16} /> Place Order</>
        )}
      </button>
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
function OrderSuccess({ orderNumber }: { orderNumber: string }) {
  const navigate = useNavigate();
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={40} className="text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Order Placed!</h2>
      <p className="text-gray-500 text-sm mb-2">Your order has been confirmed.</p>
      <p className="text-sm font-bold text-gray-800 mb-6">
        Order #{orderNumber}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => navigate("/orders")}
          className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
          style={{ background: "#2382AA" }}
        >
          Track My Order
        </button>
        <button
          onClick={() => navigate("/products")}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm border border-gray-200 text-gray-700 hover:border-gray-300"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

// ── Order summary sidebar ─────────────────────────────────────────────────────
function CartSummary() {
  const { items, total } = useCart();
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-gray-800"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2">
          <ShoppingBag size={15} className="text-[#2382AA]" />
          {items.reduce((s,i) => s + i.qty, 0)} items · Rs. {total.toLocaleString("en-PK")}
        </div>
        <Edit2 size={13} className="text-gray-400" />
      </button>
      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                <img
                  src={imgUrl(item.images?.[0])}
                  alt={item.name}
                  className="w-full h-full object-contain p-1"
                  onError={e => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 font-medium line-clamp-1">{item.name}</p>
                <p className="text-[11px] text-gray-400">x{item.qty}</p>
              </div>
              <span className="text-xs font-bold text-gray-800 flex-shrink-0">
                Rs. {(item.price * item.qty).toLocaleString("en-PK")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Checkout page ────────────────────────────────────────────────────────
export default function Checkout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { items } = useCart();

  const promoDiscount: number = (location.state as any)?.promoDiscount ?? 0;
  const promoCode: string     = (location.state as any)?.promoCode ?? "";

  const { isLoggedIn } = useAuth();
  const [step,            setStep]            = useState<number>(() => isLoggedIn ? 1 : 0);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [orderNumber,     setOrderNumber]     = useState<string | null>(null);

  // Redirect if cart is empty (only before placing)
  useEffect(() => {
    if (!orderNumber && items.length === 0) navigate("/cart", { replace: true });
  }, [items.length, orderNumber]);

  if (orderNumber) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <OrderSuccess orderNumber={orderNumber} />
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-5">
        <Link to="/"       className="hover:text-[#2382AA]">Home</Link>
        <ChevronRight size={12} />
        <Link to="/cart"   className="hover:text-[#2382AA]">Cart</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium">Checkout</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <Steps current={step} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Main form ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 px-5 sm:px-6 py-6">
          {step === 0 && (
            <LoginStep onDone={() => setStep(1)} />
          )}
          {step === 1 && (
            <div className="space-y-5">
              <AddressStep onSelect={setSelectedAddress} selected={selectedAddress} />
              <button
                onClick={() => { if (selectedAddress) setStep(2); }}
                disabled={!selectedAddress}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                style={{ background: "#2382AA" }}
              >
                Continue to Payment <ChevronRight size={16} />
              </button>
            </div>
          )}
          {step === 2 && selectedAddress && (
            <PaymentStep
              selectedAddress={selectedAddress}
              promoCode={promoCode}
              promoDiscount={promoDiscount}
              onBack={() => setStep(1)}
              onPlaced={num => setOrderNumber(num)}
            />
          )}

          {/* Back nav */}
          {step > 0 && step < 2 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="mt-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft size={14} /> Back
            </button>
          )}
        </div>

        {/* ── Cart summary sidebar ────────────────────────────────────────── */}
        <div className="space-y-4">
          <CartSummary />
          <div className="bg-[#2382AA]/5 rounded-xl px-4 py-3 text-xs text-gray-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1">
              <Shield size={13} className="text-[#2382AA]" /> Secure Checkout
            </div>
            <p className="flex items-center gap-1.5"><Lock size={11} className="text-gray-500 flex-shrink-0" /> Your data is encrypted and safe</p>
            <p className="flex items-center gap-1.5"><Package size={11} className="text-gray-500 flex-shrink-0" /> Orders confirmed within 5 minutes</p>
            <p className="flex items-center gap-1.5"><Truck size={11} className="text-gray-500 flex-shrink-0" /> Delivery in 60–90 minutes</p>
            <p className="flex items-center gap-1.5"><CheckCircle size={11} className="text-gray-500 flex-shrink-0" /> 100% satisfaction guarantee</p>
          </div>
        </div>
      </div>
    </div>
  );
}
