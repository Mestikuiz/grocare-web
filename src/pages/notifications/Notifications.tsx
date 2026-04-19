import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell, BellOff, ShoppingBag, Package, Truck, CheckCircle,
  XCircle, Info, ChevronRight, Check,
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  data?: Record<string, string>;
  createdAt: string;
}

const TYPE_ICON: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  ORDER_CONFIRMED:  { icon: ShoppingBag,   color: "text-blue-600",   bg: "bg-blue-50"   },
  ORDER_PREPARING:  { icon: Package,       color: "text-purple-600", bg: "bg-purple-50" },
  ORDER_DISPATCHED: { icon: Truck,         color: "text-cyan-600",   bg: "bg-cyan-50"   },
  ORDER_DELIVERED:  { icon: CheckCircle,   color: "text-green-600",  bg: "bg-green-50"  },
  ORDER_CANCELLED:  { icon: XCircle,       color: "text-red-500",    bg: "bg-red-50"    },
  GENERAL:          { icon: Info,          color: "text-gray-500",   bg: "bg-gray-100"  },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

export default function Notifications() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [notifs, setNotifs]   = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login", { state: { from: "/notifications" }, replace: true }); return; }
    api.get("/notifications?limit=50").then(r => {
      setNotifs(r.data?.data ?? r.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isLoggedIn]);

  const markAllRead = async () => {
    await api.patch("/notifications/mark-all-read").catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const unreadCount = notifs.filter(n => !n.isRead).length;

  if (!isLoggedIn) return null;

  return (
    <div className="max-w-[640px] mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-5">
        <Link to="/" className="hover:text-[#2382AA]">Home</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium">Notifications</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#2382AA" }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#2382AA] hover:underline"
          >
            <Check size={13} />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-5 py-4 border-b border-gray-50 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded w-40" />
                <div className="h-3 bg-gray-100 rounded w-56" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            </div>
          ))
        ) : notifs.length === 0 ? (
          <div className="py-16 text-center">
            <BellOff size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">We'll notify you about your orders here</p>
          </div>
        ) : (
          notifs.map(notif => {
            const meta = TYPE_ICON[notif.type] ?? TYPE_ICON.GENERAL;
            const Icon = meta.icon;
            const orderId = notif.data?.orderId;

            return (
              <div
                key={notif.id}
                className={`flex gap-4 px-5 py-4 border-b border-gray-50 last:border-0 cursor-pointer transition-colors
                  ${notif.isRead ? "bg-white hover:bg-gray-50" : "bg-blue-50/40 hover:bg-blue-50/60"}`}
                onClick={() => {
                  markRead(notif.id);
                  if (orderId) navigate(`/orders/${orderId}`);
                }}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                  <Icon size={17} className={meta.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${notif.isRead ? "font-medium text-gray-700" : "font-semibold text-gray-900"}`}>
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: "#2382AA" }} />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.body}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                    <Bell size={10} />
                    {timeAgo(notif.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
