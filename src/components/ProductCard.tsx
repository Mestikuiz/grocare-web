import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { imgUrl } from "../api/client";
import { useCart } from "../context/CartContext";

interface Product {
  id: string;
  slug?: string;
  name: string;
  price: number;
  comparePrice?: number;
  images?: string[];
  unit?: string;
  stock?: number;
  discountPercent?: number;
  brand?: { name: string };
  category?: { name: string };
}

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem, removeItem, getQty } = useCart();
  const [adding, setAdding] = useState(false);
  const qty = getQty(product.id);

  const image = product.images?.[0];
  const discount = product.discountPercent
    ?? (product.comparePrice && product.comparePrice > product.price
      ? Math.round((1 - product.price / product.comparePrice) * 100)
      : 0);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAdding(true);
    await addItem(product.id, product);
    setAdding(false);
  };

  return (
    <Link
      to={`/products/${product.slug || product.id}`}
      className="bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col group overflow-hidden"
    >
      {/* Image */}
      <div className="relative bg-gray-50 aspect-square overflow-hidden">
        <img
          src={imgUrl(image)}
          alt={product.name}
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            -{discount}%
          </span>
        )}
        {(product.stock ?? 1) === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-500">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        {product.brand && (
          <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">
            {product.brand.name}
          </span>
        )}
        <p className="text-sm text-gray-800 font-medium leading-snug line-clamp-2 flex-1 mb-2">
          {product.name}
        </p>
        {product.unit && (
          <span className="text-[11px] text-gray-400 mb-1">{product.unit}</span>
        )}

        {/* Price + Add button */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div>
            <span className="text-base font-bold" style={{ color: "#2382AA" }}>
              Rs. {product.price.toLocaleString("en-PK")}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <div className="text-[11px] text-gray-400 line-through">
                Rs. {product.comparePrice.toLocaleString("en-PK")}
              </div>
            )}
          </div>

          {/* Qty stepper or Add button */}
          {qty > 0 ? (
            <div
              className="flex items-center gap-1 rounded-lg overflow-hidden border"
              style={{ borderColor: "#2382AA" }}
              onClick={e => e.preventDefault()}
            >
              <button
                onClick={e => { e.preventDefault(); removeItem(product.id); }}
                className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 transition-colors"
                style={{ color: "#2382AA" }}
              >
                <Minus size={12} />
              </button>
              <span className="text-sm font-semibold min-w-[20px] text-center" style={{ color: "#2382AA" }}>
                {qty}
              </span>
              <button
                onClick={handleAdd}
                className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 transition-colors"
                style={{ color: "#2382AA" }}
              >
                <Plus size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={adding || (product.stock ?? 1) === 0}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 transition-opacity hover:opacity-85 disabled:opacity-40"
              style={{ background: "#2382AA" }}
            >
              {adding ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShoppingCart size={14} />
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
