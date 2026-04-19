import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight,
  ShoppingBag, Gift, ChevronRight, TrendingUp, Clock,
  CheckCircle, XCircle, Truck, Package,
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

interface WalletData { balance: number; coins: number; }

interface TxnEntry {
  id: string;
  type: "CREDIT" | "DEBIT" | "COINS_EARNED" | "COINS_REDEEMED" | "ORDER";
  amount: number;
  coins: number;
  description: string;
  status?: string;
  paymentMethod?: string;
  orderId?: string;
  orderNumber?: string;
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "text-yellow-600",
  CONFIRMED: "text-blue-600",
  PREPARING: "text-blue-600",
  DELIVERED: "text-green-600",
  CANCELLED: "text-red-500",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
  PICKED_UP: Truck,
  ASSIGNED:  Truck,
  DEFAULT:   Package,
};

function txnMeta(txn: TxnEntry) {
  if (txn.type === "ORDER") {
    const Icon = STATUS_ICON[txn.status ?? ""] ?? STATUS_ICON.DEFAULT;
    const color = txn.status === "CANCELLED" ? "text-red-500" : txn.status === "DELIVERED" ? "text-green-600" : "text-[#2382AA]";
    return { Icon, iconColor: color, bg: "bg-blue-50", amountColor: "text-gray-700", prefix: "" };
  }
  const map: Record<string, any> = {
    CREDIT:         { Icon: ArrowDownLeft,  iconColor: "text-green-600",  bg: "bg-green-50",  amountColor: "text-green-600",  prefix: "+" },
    DEBIT:          { Icon: ArrowUpRight,   iconColor: "text-red-500",    bg: "bg-red-50",    amountColor: "text-red-500",    prefix: "-" },
    COINS_EARNED:   { Icon: Gift,           iconColor: "text-amber-600",  bg: "bg-amber-50",  amountColor: "text-amber-600",  prefix: "+" },
    COINS_REDEEMED: { Icon: Gift,           iconColor: "text-purple-600", bg: "bg-purple-50", amountColor: "text-purple-600", prefix: "-" },
  };
  return map[txn.type] ?? map.CREDIT;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-50 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-gray-100 rounded w-48" />
        <div className="h-3 bg-gray-100 rounded w-28" />
      </div>
      <div className="h-4 bg-gray-100 rounded w-16" />
    </div>
  );
}

export default function WalletPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [wallet,     setWallet]     = useState<WalletData | null>(null);
  const [txns,       setTxns]       = useState<TxnEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [txnLoading, setTxnLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login", { replace: true }); return; }

    api.get("/wallet").then(r => {
      const d = r.data?.data ?? r.data;
      setWallet({ balance: d.balance ?? 0, coins: d.coins ?? 0 });
    }).catch(() => {}).finally(() => setLoading(false));

    api.get("/wallet/transactions?limit=40").then(r => {
      setTxns(r.data?.data ?? r.data ?? []);
    }).catch(() => {}).finally(() => setTxnLoading(false));
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  const coinsValue = wallet ? (wallet.coins / 100).toFixed(2) : "0.00";

  return (
    <div className="max-w-[760px] mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-5">
        <Link to="/" className="hover:text-[#2382AA]">Home</Link>
        <ChevronRight size={12} />
        <Link to="/profile" className="hover:text-[#2382AA]">Account</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium">Wallet & Coins</span>
      </nav>

      <h1 className="text-xl font-bold text-gray-900 mb-5">Wallet & Loyalty Coins</h1>

      {/* Balance cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl p-5 text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #2382AA 0%, #1a6a8a 100%)" }}>
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 bg-white" />
            <WalletIcon size={22} className="mb-3 opacity-90" />
            <p className="text-xs opacity-75 mb-0.5">Wallet Balance</p>
            <p className="text-2xl font-bold">Rs. {(wallet?.balance ?? 0).toLocaleString("en-PK")}</p>
            <p className="text-[11px] opacity-60 mt-1">Redeemable on next order</p>
          </div>
          <div className="rounded-2xl p-5 text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}>
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 bg-white" />
            <Gift size={22} className="mb-3 opacity-90" />
            <p className="text-xs opacity-75 mb-0.5">Loyalty Coins</p>
            <p className="text-2xl font-bold">{(wallet?.coins ?? 0).toLocaleString()}</p>
            <p className="text-[11px] opacity-60 mt-1">≈ Rs. {coinsValue} value</p>
          </div>
        </div>
      )}

      {/* How coins work */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex gap-3">
        <TrendingUp size={18} className="text-[#2382AA] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-1">How coins work</p>
          <ul className="text-xs text-gray-600 space-y-0.5">
            <li>• Earn 10 coins for every Rs. 100 spent</li>
            <li>• 100 coins = Rs. 1 discount on next order</li>
            <li>• Coins credited automatically when order is delivered</li>
            <li>• Apply coins at checkout (up to 20% of order value)</li>
          </ul>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">Transaction History</h2>
          <div className="flex items-center gap-2">
            <Link to="/orders" className="text-xs text-[#2382AA] font-medium hover:underline flex items-center gap-1">
              <ShoppingBag size={12} /> All Orders
            </Link>
            <Clock size={14} className="text-gray-400" />
          </div>
        </div>

        <div className="px-5">
          {txnLoading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : txns.length === 0 ? (
            <div className="py-12 text-center">
              <WalletIcon size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">No transactions yet</p>
              <p className="text-xs text-gray-400 mt-1">Place an order to start earning coins</p>
              <Link to="/products"
                className="inline-block mt-4 px-5 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: "#2382AA" }}>
                Shop Now
              </Link>
            </div>
          ) : (
            txns.map(txn => {
              const meta = txnMeta(txn);
              const { Icon } = meta;
              const isCoins = txn.type === "COINS_EARNED" || txn.type === "COINS_REDEEMED";
              const isOrder = txn.type === "ORDER";

              return (
                <div key={txn.id}
                  className={`flex items-center gap-4 py-4 border-b border-gray-50 last:border-0 ${isOrder ? "cursor-pointer hover:bg-gray-50 -mx-5 px-5 rounded-xl transition-colors" : ""}`}
                  onClick={() => isOrder && txn.orderId && navigate(`/orders/${txn.orderId}`)}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                    <Icon size={16} className={meta.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{txn.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] text-gray-400">
                        {new Date(txn.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {isOrder && txn.status && (
                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${STATUS_COLOR[txn.status] ?? "text-gray-500"}`}>
                          {txn.status}
                        </span>
                      )}
                      {isOrder && txn.paymentMethod && (
                        <span className="text-[10px] text-gray-400">{txn.paymentMethod}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {isCoins ? (
                      <p className={`text-sm font-semibold ${meta.amountColor}`}>
                        {meta.prefix}{txn.coins} coins
                      </p>
                    ) : (
                      <p className={`text-sm font-semibold ${meta.amountColor}`}>
                        {isOrder ? "" : meta.prefix}Rs. {txn.amount.toLocaleString("en-PK")}
                      </p>
                    )}
                    {isOrder && (
                      <ChevronRight size={12} className="text-gray-300 ml-auto mt-0.5" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
