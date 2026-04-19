import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag, ChevronRight, Loader2, PackageOpen, Clock,
  CheckCircle, XCircle, Truck, Package,
} from "lucide-react";
import { api, imgUrl } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────
interface OrderItem {
  product: { name: string; images?: string[] };
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING:    { label: "Pending",    color: "text-yellow-700", bg: "bg-yellow-50",  icon: Clock },
  CONFIRMED:  { label: "Confirmed",  color: "text-blue-700",   bg: "bg-blue-50",    icon: CheckCircle },
  PREPARING:  { label: "Preparing",  color: "text-purple-700", bg: "bg-purple-50",  icon: Package },
  READY:      { label: "Ready",      color: "text-indigo-700", bg: "bg-indigo-50",  icon: Package },
  ASSIGNED:   { label: "Assigned",   color: "text-cyan-700",   bg: "bg-cyan-50",    icon: Truck },
  PICKED_UP:  { label: "On the way", color: "text-cyan-700",   bg: "bg-cyan-50",    icon: Truck },
  DELIVERED:  { label: "Delivered",  color: "text-green-700",  bg: "bg-green-50",   icon: CheckCircle },
  CANCELLED:  { label: "Cancelled",  color: "text-red-600",    bg: "bg-red-50",     icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS[status] ?? { label: status, color: "text-gray-600", bg: "bg-gray-100", icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ── Order card ────────────────────────────────────────────────────────────────
function OrderCard({ order }: { order: Order }) {
  const firstImage = order.items[0]?.product.images?.[0];
  const extraItems = order.items.length - 1;
  const date       = new Date(order.createdAt).toLocaleDateString("en-PK", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <Link
      to={`/orders/${order.id}`}
      className="bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all p-4 flex items-center gap-4 group"
    >
      {/* Product image stack */}
      <div className="relative w-14 h-14 flex-shrink-0">
        <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
          <img
            src={imgUrl(firstImage)}
            alt=""
            className="w-full h-full object-contain p-1.5"
            onError={e => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
          />
        </div>
        {extraItems > 0 && (
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#2382AA] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
            +{extraItems}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-bold text-gray-800">#{order.orderNumber}</span>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-xs text-gray-500 truncate">
          {order.items.map(i => i.product.name).join(", ")}
        </p>
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <span className="text-xs text-gray-400">{date}</span>
          <span className="text-sm font-bold" style={{ color: "#2382AA" }}>
            Rs. {order.total.toLocaleString("en-PK")}
          </span>
        </div>
      </div>

      <ChevronRight size={15} className="text-gray-300 group-hover:text-[#2382AA] flex-shrink-0 transition-colors" />
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 animate-pulse">
      <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-100 rounded w-28" />
          <div className="h-5 bg-gray-100 rounded w-20" />
        </div>
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="flex justify-between">
          <div className="h-3 bg-gray-100 rounded w-20" />
          <div className="h-4 bg-gray-100 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTERS = [
  { key: "",          label: "All" },
  { key: "PENDING",   label: "Pending" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

// ── Main Orders page ──────────────────────────────────────────────────────────
export default function Orders() {
  const { isLoggedIn } = useAuth();
  const navigate       = useNavigate();

  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("");
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const LIMIT = 10;

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login", { state: { from: "/orders" }, replace: true }); return; }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    api.get("/orders/my", { params: { page, limit: LIMIT } })
      .then(r => {
        const all: Order[] = r.data?.data ?? r.data ?? [];
        setTotal(r.data?.meta?.total ?? all.length);
        setOrders(all);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn, page]);

  const filtered = filter
    ? orders.filter(o => o.status === filter)
    : orders;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-[800px] mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-5">
        <Link to="/"       className="hover:text-[#2382AA]">Home</Link>
        <ChevronRight size={12} />
        <Link to="/profile" className="hover:text-[#2382AA]">Profile</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium">My Orders</span>
      </nav>

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag size={22} style={{ color: "#2382AA" }} />
          My Orders
        </h1>
        {!loading && <span className="text-sm text-gray-500">{total} order{total !== 1 ? "s" : ""}</span>}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(1); }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all
              ${filter === f.key
                ? "text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"}`}
            style={filter === f.key ? { background: "#2382AA" } : {}}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <PackageOpen size={28} className="text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">No orders yet</h3>
            <p className="text-sm text-gray-500 mb-5">
              {filter ? "No orders with this status." : "You haven't placed any orders yet."}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85 transition-opacity"
              style={{ background: "#2382AA" }}
            >
              <ShoppingBag size={15} /> Start Shopping
            </Link>
          </div>
        ) : (
          filtered.map(o => <OrderCard key={o.id} order={o} />)
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-gray-300"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-gray-300"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
