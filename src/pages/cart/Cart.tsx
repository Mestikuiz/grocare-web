import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart, Trash2, Plus, Minus, Tag, ChevronRight,
  ArrowRight, PackageOpen, CheckCircle, X, Loader2,
} from "lucide-react";
import { imgUrl, api } from "../../api/client";
import { useCart } from "../../context/CartContext";

const DELIVERY_FEE   = 99;
const FREE_DELIVERY_THRESHOLD = 1500;

// ── Promo code state ──────────────────────────────────────────────────────────
interface PromoState {
  code: string;
  discount: number;
  promoName?: string;
  error: string;
  loading: boolean;
  applied: boolean;
}

// ── Cart item row ─────────────────────────────────────────────────────────────
function CartRow({
  item,
  onAdd,
  onRemove,
  onDelete,
}: {
  item: { id: string; name: string; price: number; comparePrice?: number; images?: string[]; unit?: string; qty: number };
  onAdd: () => void;
  onRemove: () => void;
  onDelete: () => void;
}) {
  const lineTotal = item.price * item.qty;

  return (
    <div className="flex items-start gap-3 sm:gap-4 py-4 border-b border-gray-100 last:border-0">
      {/* Image */}
      <Link to={`/products/${item.id}`} className="flex-shrink-0">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
          <img
            src={imgUrl(item.images?.[0])}
            alt={item.name}
            className="w-full h-full object-contain p-1.5"
            onError={e => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
          />
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/products/${item.id}`}
          className="text-sm font-medium text-gray-800 hover:text-[#2382AA] line-clamp-2 leading-snug"
        >
          {item.name}
        </Link>
        {item.unit && <p className="text-xs text-gray-400 mt-0.5">{item.unit}</p>}

        <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
          {/* Qty stepper */}
          <div
            className="inline-flex items-center rounded-lg overflow-hidden border"
            style={{ borderColor: "#2382AA" }}
          >
            <button
              onClick={onRemove}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 transition-colors"
              style={{ color: "#2382AA" }}
            >
              <Minus size={12} />
            </button>
            <span className="text-sm font-bold min-w-[28px] text-center" style={{ color: "#2382AA" }}>
              {item.qty}
            </span>
            <button
              onClick={onAdd}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 transition-colors"
              style={{ color: "#2382AA" }}
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Line price */}
          <div className="text-right">
            <span className="text-sm font-bold" style={{ color: "#2382AA" }}>
              Rs. {lineTotal.toLocaleString("en-PK")}
            </span>
            {item.qty > 1 && (
              <p className="text-[10px] text-gray-400">
                Rs. {item.price.toLocaleString("en-PK")} each
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="flex-shrink-0 mt-1 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        title="Remove item"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Order summary ─────────────────────────────────────────────────────────────
function OrderSummary({
  subtotal,
  promoDiscount,
  onCheckout,
}: {
  subtotal: number;
  promoDiscount: number;
  onCheckout: () => void;
}) {
  const freeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
  const delivery     = freeDelivery ? 0 : DELIVERY_FEE;
  const total        = subtotal - promoDiscount + delivery;
  const toFree       = FREE_DELIVERY_THRESHOLD - subtotal;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-24">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-900 text-base">Order Summary</h2>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Free delivery progress */}
        {!freeDelivery && (
          <div className="bg-[#2382AA]/5 rounded-xl p-3 mb-1">
            <p className="text-xs text-gray-600 mb-1.5">
              Add <span className="font-semibold text-[#2382AA]">Rs. {toFree.toLocaleString("en-PK")}</span> more for{" "}
              <span className="font-semibold text-green-600">FREE delivery</span>
            </p>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%`,
                  background: "#2382AA",
                }}
              />
            </div>
          </div>
        )}
        {freeDelivery && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 px-3 py-2 rounded-xl">
            <CheckCircle size={13} />
            You've unlocked FREE delivery!
          </div>
        )}

        {/* Line items */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium text-gray-800">Rs. {subtotal.toLocaleString("en-PK")}</span>
          </div>
          {promoDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Promo discount</span>
              <span className="font-medium">− Rs. {promoDiscount.toLocaleString("en-PK")}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Delivery</span>
            {freeDelivery ? (
              <span className="font-medium text-green-600">FREE</span>
            ) : (
              <span className="font-medium text-gray-800">Rs. {delivery.toLocaleString("en-PK")}</span>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900">Total</span>
            <span className="text-xl font-extrabold" style={{ color: "#2382AA" }}>
              Rs. {total.toLocaleString("en-PK")}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        <button
          onClick={onCheckout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-85"
          style={{ background: "#2382AA" }}
        >
          Proceed to Checkout <ArrowRight size={16} />
        </button>
        <Link
          to="/products"
          className="mt-2.5 block text-center text-sm text-gray-500 hover:text-[#2382AA] transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

// ── Main Cart page ────────────────────────────────────────────────────────────
export default function Cart() {
  const navigate = useNavigate();
  const { items, itemCount, total, addItem, removeItem, updateQty, clearCart } = useCart();

  const [promo, setPromo] = useState<PromoState>({
    code: "", discount: 0, error: "", loading: false, applied: false,
  });

  const handleApplyPromo = async () => {
    if (!promo.code.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setPromo(p => ({ ...p, error: "Please login to apply promo codes.", loading: false }));
      return;
    }
    setPromo(p => ({ ...p, loading: true, error: "", applied: false }));
    try {
      const res = await api.get("/promotions/validate", {
        params: { code: promo.code.trim().toUpperCase(), subtotal: total },
      });
      const d = res.data;
      setPromo(p => ({
        ...p,
        discount: Math.floor(d.discount ?? 0),
        promoName: d.promo?.code,
        applied: true,
        loading: false,
        error: "",
      }));
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Invalid promo code.";
      setPromo(p => ({ ...p, discount: 0, applied: false, loading: false, error: msg }));
    }
  };

  const handleRemovePromo = () => {
    setPromo({ code: "", discount: 0, error: "", loading: false, applied: false });
  };

  const handleCheckout = () => {
    navigate("/checkout", { state: { promoDiscount: promo.discount, promoCode: promo.promoName } });
  };

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (itemCount === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Cart</h1>
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <PackageOpen size={32} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Your cart is empty</h2>
          <p className="text-gray-500 text-sm mb-6">Looks like you haven't added anything yet.</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-85 transition-opacity"
            style={{ background: "#2382AA" }}
          >
            <ShoppingCart size={16} />
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">My Cart</h1>
          <span className="bg-[#2382AA]/10 text-[#2382AA] text-sm font-semibold px-2.5 py-0.5 rounded-full">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
        >
          <Trash2 size={12} /> Clear all
        </button>
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
        <Link to="/" className="hover:text-[#2382AA]">Home</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium">Cart</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Cart items ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 px-4 sm:px-5">
            {items.map(item => (
              <CartRow
                key={item.id}
                item={item}
                onAdd={() => addItem(item.id, item)}
                onRemove={() => removeItem(item.id)}
                onDelete={() => updateQty(item.id, 0)}
              />
            ))}
          </div>

          {/* Promo code */}
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={15} className="text-[#2382AA]" />
              <span className="text-sm font-semibold text-gray-800">Promo Code</span>
            </div>

            {promo.applied ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                  <CheckCircle size={15} />
                  <span className="font-bold">{promo.promoName}</span> applied
                  <span className="text-green-600 text-xs">
                    (− Rs. {promo.discount.toLocaleString("en-PK")})
                  </span>
                </div>
                <button
                  onClick={handleRemovePromo}
                  className="text-green-500 hover:text-green-700 ml-2"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promo.code}
                  onChange={e => setPromo(p => ({ ...p, code: e.target.value.toUpperCase(), error: "" }))}
                  onKeyDown={e => e.key === "Enter" && handleApplyPromo()}
                  placeholder="Enter promo code"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]/30 focus:border-[#2382AA] uppercase placeholder:normal-case placeholder:text-gray-400"
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={!promo.code.trim() || promo.loading}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                  style={{ background: "#2382AA" }}
                >
                  {promo.loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  Apply
                </button>
              </div>
            )}

            {promo.error && (
              <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                <X size={11} /> {promo.error}
              </p>
            )}
          </div>
        </div>

        {/* ── Order summary ─────────────────────────────────────────────── */}
        <div>
          <OrderSummary
            subtotal={total}
            promoDiscount={promo.discount}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  );
}
