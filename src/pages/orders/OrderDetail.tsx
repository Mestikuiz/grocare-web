import { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ChevronRight, MapPin, Phone, Clock, CheckCircle, XCircle,
  Truck, Package, Loader2, ArrowLeft, Copy, Check,
} from "lucide-react";
import { api, imgUrl } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────
interface OrderItem {
  product: { id: string; name: string; images?: string[]; unit?: string };
  quantity: number;
  price: number;
  originalPrice?: number;
  savedAmount?: number;
  total: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount?: number;
  promoDiscount?: number;
  promoCode?: string;
  notes?: string;
  walletCode?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address: { label?: string; fullAddress: string; area: string; city: string };
  payment?: { method: string; status: string; transactionId?: string };
  rider?: { user: { name?: string; phone?: string } };
  city?: { name: string };
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING:    { label: "Pending",      color: "text-yellow-700", bg: "bg-yellow-50",  icon: Clock },
  CONFIRMED:  { label: "Confirmed",    color: "text-blue-700",   bg: "bg-blue-50",    icon: CheckCircle },
  PREPARING:  { label: "Preparing",    color: "text-purple-700", bg: "bg-purple-50",  icon: Package },
  READY:      { label: "Ready",        color: "text-indigo-700", bg: "bg-indigo-50",  icon: Package },
  ASSIGNED:   { label: "Rider Assigned",color:"text-cyan-700",   bg: "bg-cyan-50",    icon: Truck },
  PICKED_UP:  { label: "Out for Delivery", color:"text-cyan-700",bg: "bg-cyan-50",    icon: Truck },
  DELIVERED:  { label: "Delivered",    color: "text-green-700",  bg: "bg-green-50",   icon: CheckCircle },
  CANCELLED:  { label: "Cancelled",    color: "text-red-600",    bg: "bg-red-50",     icon: XCircle },
};

const ORDER_STEPS = ["CONFIRMED", "PREPARING", "READY", "PICKED_UP", "DELIVERED"];

// ── Progress tracker ──────────────────────────────────────────────────────────
function OrderTracker({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500 font-medium">
        <XCircle size={16} /> Order Cancelled
      </div>
    );
  }

  const currentIdx = ORDER_STEPS.indexOf(status);

  const STEP_LABELS: Record<string, string> = {
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    READY:     "Ready",
    PICKED_UP: "On the Way",
    DELIVERED: "Delivered",
  };

  return (
    <div className="relative">
      {/* Line */}
      <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 z-0" />
      <div
        className="absolute top-4 left-4 h-0.5 z-0 transition-all duration-500"
        style={{
          width: currentIdx >= 0 ? `${(currentIdx / (ORDER_STEPS.length - 1)) * 100}%` : "0%",
          background: "#2382AA",
        }}
      />

      <div className="relative z-10 flex justify-between">
        {ORDER_STEPS.map((step, i) => {
          const done   = i <= currentIdx;
          const active = i === currentIdx;
          const Icon   = done ? CheckCircle : (i === ORDER_STEPS.length - 1 ? CheckCircle : Clock);
          return (
            <div key={step} className="flex flex-col items-center gap-1.5" style={{ width: "20%" }}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white transition-all
                ${done   ? "border-[#2382AA]"
                : active ? "border-[#2382AA]"
                         : "border-gray-200"}`}>
                <Icon size={14} style={{ color: done ? "#2382AA" : "#D1D5DB" }} />
              </div>
              <span className={`text-[10px] text-center leading-tight hidden sm:block
                ${done ? "text-[#2382AA] font-semibold" : "text-gray-400"}`}>
                {STEP_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="text-gray-400 hover:text-[#2382AA] transition-colors">
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-50">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY", "ASSIGNED", "PICKED_UP"];

// ── Main component ────────────────────────────────────────────────────────────
export default function OrderDetail() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const { isLoggedIn } = useAuth();

  const [order,    setOrder]    = useState<Order | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrder = (quiet = false) => {
    if (!id) return;
    if (!quiet) setLoading(true);
    api.get(`/orders/my/${id}`)
      .then(r => {
        const data = r.data?.data ?? r.data;
        setOrder(data);
        // Stop polling once terminal status reached
        if (!ACTIVE_STATUSES.includes(data?.status)) {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        }
      })
      .catch(e => { if (e?.response?.status === 404) setNotFound(true); })
      .finally(() => { if (!quiet) setLoading(false); });
  };

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login", { state: { from: `/orders/${id}` }, replace: true }); return; }
    fetchOrder();
  }, [id, isLoggedIn]);

  // Start polling for active orders
  useEffect(() => {
    if (!order) return;
    if (ACTIVE_STATUSES.includes(order.status)) {
      pollRef.current = setInterval(() => fetchOrder(true), 30_000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [order?.status]);

  const handleCancel = async () => {
    if (!order || !confirm("Cancel this order?")) return;
    setCancelling(true);
    try {
      await api.put(`/orders/my/${order.id}/cancel`);
      setOrder(prev => prev ? { ...prev, status: "CANCELLED" } : prev);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Could not cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-10 flex justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">Order not found.</p>
        <Link to="/orders" className="text-[#2382AA] hover:underline text-sm">← Back to orders</Link>
      </div>
    );
  }

  const cfg       = STATUS[order.status] ?? STATUS["PENDING"];
  const StatusIcon = cfg.icon;
  const canCancel = ["PENDING", "CONFIRMED"].includes(order.status);
  const promoDisc = order.promoDiscount ?? order.discount ?? 0;

  const formatDate = (d: string) => new Date(d).toLocaleString("en-PK", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="max-w-[800px] mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-5 flex-wrap">
        <Link to="/"        className="hover:text-[#2382AA]">Home</Link>
        <ChevronRight size={12} />
        <Link to="/orders"  className="hover:text-[#2382AA]">My Orders</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium">#{order.orderNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <CopyBtn text={order.orderNumber} />
          </div>
          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
            <StatusIcon size={12} /> {cfg.label}
          </span>
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 flex items-center gap-1"
            >
              {cancelling ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">

        {/* Status tracker */}
        <Section title={
          <span className="flex items-center gap-2">
            Order Status
            {ACTIVE_STATUSES.includes(order.status) && (
              <span className="flex items-center gap-1 text-[10px] font-normal text-green-500">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            )}
          </span>
        }>
          <OrderTracker status={order.status} />

          {/* Rider info */}
          {order.rider?.user && (
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#2382AA]/10 flex items-center justify-center flex-shrink-0">
                <Truck size={16} style={{ color: "#2382AA" }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Your Rider</p>
                <p className="text-sm font-semibold text-gray-800">{order.rider.user.name ?? "Rider"}</p>
                {order.rider.user.phone && (
                  <a href={`tel:${order.rider.user.phone}`}
                    className="text-xs text-[#2382AA] flex items-center gap-1 hover:underline">
                    <Phone size={10} /> {order.rider.user.phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Wallet code (COD hint) */}
          {order.walletCode && order.status !== "DELIVERED" && order.paymentMethod === "COD" && (
            <div className="mt-3 pt-3 border-t border-gray-50">
              <p className="text-xs text-gray-500 mb-1">Wallet Code (share with rider on delivery)</p>
              <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                <span className="text-lg font-bold tracking-[0.3em] text-gray-800">{order.walletCode}</span>
                <CopyBtn text={order.walletCode} />
              </div>
            </div>
          )}
        </Section>

        {/* Items */}
        <Section title={`Items (${order.items.length})`}>
          <div className="divide-y divide-gray-50">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Link to={`/products/${item.product.id}`} className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
                    <img
                      src={imgUrl(item.product.images?.[0])}
                      alt={item.product.name}
                      className="w-full h-full object-contain p-1"
                      onError={e => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
                    />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product.id}`}
                    className="text-sm font-medium text-gray-800 hover:text-[#2382AA] line-clamp-1">
                    {item.product.name}
                  </Link>
                  {item.product.unit && <p className="text-[11px] text-gray-400">{item.product.unit}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">x{item.quantity} × Rs. {item.price.toLocaleString("en-PK")}</p>
                  <p className="text-sm font-bold text-gray-800">Rs. {item.total.toLocaleString("en-PK")}</p>
                  {item.savedAmount && item.savedAmount > 0 ? (
                    <p className="text-[10px] text-green-600">saved Rs. {item.savedAmount.toLocaleString("en-PK")}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Price breakdown */}
        <Section title="Price Breakdown">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium text-gray-800">Rs. {order.subtotal.toLocaleString("en-PK")}</span>
            </div>
            {promoDisc > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Promo {order.promoCode ? `(${order.promoCode})` : "discount"}</span>
                <span className="font-medium">− Rs. {promoDisc.toLocaleString("en-PK")}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Delivery fee</span>
              {order.deliveryFee === 0
                ? <span className="text-green-600 font-medium">FREE</span>
                : <span className="font-medium text-gray-800">Rs. {order.deliveryFee.toLocaleString("en-PK")}</span>}
            </div>
            {order.serviceFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Service fee</span>
                <span className="font-medium text-gray-800">Rs. {order.serviceFee.toLocaleString("en-PK")}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="font-bold text-gray-900">Total Paid</span>
              <span className="text-base font-extrabold" style={{ color: "#2382AA" }}>
                Rs. {order.total.toLocaleString("en-PK")}
              </span>
            </div>
          </div>
        </Section>

        {/* Delivery & Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <Section title="Delivery Address">
            <div className="flex items-start gap-2">
              <MapPin size={14} style={{ color: "#2382AA" }} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-0.5">{order.address.label ?? "Address"}</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {order.address.fullAddress}, {order.address.area}, {order.address.city}
                </p>
              </div>
            </div>
          </Section>

          <Section title="Payment">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-semibold text-gray-800">
                  {order.paymentMethod.replace("_", " ")}
                </span>
              </div>
              {order.payment && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-semibold text-xs px-2 py-0.5 rounded-full
                    ${order.payment.status === "PAID"
                      ? "bg-green-50 text-green-700"
                      : order.payment.status === "FAILED"
                      ? "bg-red-50 text-red-600"
                      : "bg-yellow-50 text-yellow-700"}`}>
                    {order.payment.status}
                  </span>
                </div>
              )}
              {order.payment?.transactionId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Txn ID</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-700 font-mono">{order.payment.transactionId}</span>
                    <CopyBtn text={order.payment.transactionId} />
                  </div>
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* Notes */}
        {order.notes && (
          <Section title="Order Notes">
            <p className="text-sm text-gray-600">{order.notes}</p>
          </Section>
        )}

        {/* Back */}
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Orders
        </button>
      </div>
    </div>
  );
}
