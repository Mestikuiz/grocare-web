import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronRight, ShoppingCart, Plus, Minus, Tag, Package,
  Truck, CheckCircle, AlertCircle, ArrowLeft, Star, Heart, Share2,
} from "lucide-react";
import { api, imgUrl } from "../../api/client";
import { useCart } from "../../context/CartContext";
import { useCity } from "../../context/CityContext";
import ProductCard from "../../components/ProductCard";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  nameUrdu?: string;
  description?: string;
  price: number;
  comparePrice?: number;
  originalPrice?: number;
  savedAmount?: number;
  savedPercent?: number;
  hasDiscount?: boolean;
  discountName?: string;
  unit?: string;
  weight?: string;
  sku?: string;
  tags?: string[];
  images?: string[];
  category?: { id: string; name: string; image?: string };
  brand?: { id: string; name: string; logo?: string; slug?: string };
  stock?: number;
  cityStock?: number;
  isSoldOut?: boolean;
  isFeatured?: boolean;
  similarItems?: SimilarProduct[];
}

interface SimilarProduct {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  images?: string[];
  unit?: string;
  stock?: number;
  brand?: { name: string };
  category?: { name: string };
}

// ── Image gallery ─────────────────────────────────────────────────────────────
function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgs = images.length > 0 ? images : [""];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
  };

  return (
    <div className="flex flex-col gap-3 sticky top-6">
      {/* Main image with zoom */}
      <div
        ref={containerRef}
        className="relative bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden aspect-square flex items-center justify-center cursor-zoom-in"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={imgUrl(imgs[active])}
          alt={name}
          className="w-full h-full object-contain p-6 select-none transition-transform duration-200"
          style={{
            transform: zoomed ? "scale(2)" : "scale(1)",
            transformOrigin: `${origin.x}% ${origin.y}%`,
          }}
          onError={e => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
          draggable={false}
        />
        {/* Zoom hint */}
        {!zoomed && imgs[active] && (
          <div className="absolute bottom-3 right-3 bg-black/30 text-white text-[10px] font-medium px-2 py-1 rounded-lg opacity-70 pointer-events-none">
            Hover to zoom
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {imgs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {imgs.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden bg-white transition-all duration-150
                ${i === active
                  ? "border-[#2382AA] shadow-md shadow-[#2382AA]/20 scale-105"
                  : "border-gray-100 hover:border-gray-300"}`}
            >
              <img
                src={imgUrl(img)}
                alt={`${name} ${i + 1}`}
                className="w-full h-full object-contain p-1.5"
                onError={e => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Image count indicator */}
      {imgs.length > 1 && (
        <p className="text-[11px] text-center text-gray-400">
          {active + 1} / {imgs.length}
        </p>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-64 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-3 bg-gray-100 rounded w-24" />
          <div className="h-7 bg-gray-100 rounded w-3/4" />
          <div className="h-5 bg-gray-100 rounded w-1/2" />
          <div className="h-10 bg-gray-100 rounded w-1/3" />
          <div className="space-y-2 pt-4">
            <div className="h-3 bg-gray-100 rounded" />
            <div className="h-3 bg-gray-100 rounded w-5/6" />
            <div className="h-3 bg-gray-100 rounded w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Similar products carousel ─────────────────────────────────────────────────
function SimilarCarousel({
  items, categoryId, categoryName,
}: {
  items: SimilarProduct[];
  categoryId?: string;
  categoryName?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 240 : -240, behavior: "smooth" });
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Similar Products</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#2382AA] hover:text-[#2382AA] transition-colors"
          >
            <ChevronRight size={14} className="rotate-180" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#2382AA] hover:text-[#2382AA] transition-colors"
          >
            <ChevronRight size={14} />
          </button>
          {categoryId && (
            <Link
              to={`/products?category=${categoryId}`}
              className="text-sm font-medium hover:underline flex items-center gap-1 ml-1"
              style={{ color: "#2382AA" }}
            >
              See all <ChevronRight size={14} />
            </Link>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map(p => (
          <div key={p.id} className="flex-shrink-0 w-44">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Description with Read More ────────────────────────────────────────────────
function DescriptionBlock({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <div
        className="product-desc text-sm text-gray-600 leading-relaxed overflow-hidden transition-all duration-300"
        style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: expanded ? 'unset' : 3, overflow: expanded ? 'visible' : 'hidden' } as React.CSSProperties}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <button
        onClick={() => setExpanded(e => !e)}
        className="mt-2 text-xs font-semibold text-[#2382AA] hover:underline"
      >
        {expanded ? 'Read Less ▲' : 'Read More ▼'}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedCity } = useCity();
  const { addItem, removeItem, getQty } = useCart();

  const [product,   setProduct]   = useState<Product | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [copied,    setCopied]    = useState(false);

  const qty = product ? getQty(product.id) : 0;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    const params: Record<string, string> = {};
    if (selectedCity?.id) params.cityId = selectedCity.id;

    api.get(`/products/${id}`, { params })
      .then(r => {
        const d = r.data?.data ?? r.data;
        setProduct(d);
      })
      .catch(err => {
        if (err?.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id, selectedCity?.id]);

  const handleAdd = async () => {
    if (!product) return;
    await addItem(product.id, product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (loading) return <Skeleton />;

  if (notFound || !product) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-20 text-center">
        <div className="mb-4 flex justify-center"><Package size={52} className="text-gray-200" /></div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Product not found</h2>
        <p className="text-gray-500 text-sm mb-6">This product may have been removed or is unavailable.</p>
        <button
          onClick={() => navigate("/products")}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#2382AA" }}
        >
          Browse Products
        </button>
      </div>
    );
  }

  const inStock = !product.isSoldOut && (product.cityStock ?? product.stock ?? 1) > 0;
  const discount = product.savedPercent
    ?? (product.comparePrice && product.comparePrice > product.price
      ? Math.round((1 - product.price / product.comparePrice) * 100) : 0);
  const originalPrice = product.originalPrice ?? product.comparePrice;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-5 flex-wrap">
        <Link to="/" className="hover:text-[#2382AA]">Home</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-[#2382AA]">Products</Link>
        {product.category && (
          <>
            <ChevronRight size={12} />
            <Link to={`/categories/${product.category.id}`} className="hover:text-[#2382AA]">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium line-clamp-1 max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

        {/* ── Left: images ─────────────────────────────────────────────────── */}
        <ImageGallery images={product.images ?? []} name={product.name} />

        {/* ── Right: info ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Discount badge */}
          {(product.savedAmount && product.savedAmount > 0) || discount > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold px-3 py-1 rounded-lg"
                style={{ background: "#FFF176", color: "#7c5d00" }}>
                Rs. {(product.savedAmount ?? Math.round((originalPrice ?? 0) - product.price)).toLocaleString("en-PK")} off
              </span>
              {product.discountName && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#2382AA]/10 text-[#2382AA]">
                  {product.discountName}
                </span>
              )}
            </div>
          ) : null}

          {/* Name */}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">{product.name}</h1>
            {product.nameUrdu && (
              <p className="text-base text-gray-500 mt-1 font-medium" dir="rtl">{product.nameUrdu}</p>
            )}
          </div>

          {/* Price row */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-extrabold text-gray-900">
              Rs. {product.price.toLocaleString("en-PK")}
            </span>
            {originalPrice && originalPrice > product.price && (
              <span className="text-lg text-gray-400 line-through font-medium">
                Rs. {originalPrice.toLocaleString("en-PK")}
              </span>
            )}
          </div>

          {/* Stock status */}
          {!inStock ? (
            <span className="flex items-center gap-1.5 text-sm text-red-500 font-medium">
              <AlertCircle size={15} /> Out of Stock
            </span>
          ) : (product.cityStock ?? product.stock) !== undefined && (product.cityStock ?? product.stock)! <= 10 && (product.cityStock ?? product.stock)! > 0 ? (
            <span className="text-xs font-semibold text-orange-500">
              Only {product.cityStock ?? product.stock} left in stock
            </span>
          ) : null}

          {/* Add to cart — full width */}
          {qty === 0 ? (
            <button
              onClick={handleAdd}
              disabled={!inStock}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              style={{ background: "#1a1a1a" }}
            >
              <ShoppingCart size={18} />
              Add to Cart
            </button>
          ) : (
            <div className="flex items-center gap-3"
              style={{ animation: justAdded ? "slideInUp 0.35s cubic-bezier(0.22,1,0.36,1) forwards" : "none" }}>
              {/* Qty stepper */}
              <div className="flex items-center rounded-xl overflow-hidden border-2" style={{ borderColor: "#2382AA" }}>
                <button onClick={() => removeItem(product.id)}
                  className="w-11 h-11 flex items-center justify-center hover:bg-blue-50 transition-colors"
                  style={{ color: "#2382AA" }}>
                  <Minus size={16} />
                </button>
                <span className="px-4 text-lg font-bold" style={{ color: "#2382AA" }}>{qty}</span>
                <button onClick={handleAdd}
                  className="w-11 h-11 flex items-center justify-center hover:bg-blue-50 transition-colors"
                  style={{ color: "#2382AA" }}>
                  <Plus size={16} />
                </button>
              </div>
              {/* View cart */}
              <button onClick={() => navigate("/cart")}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                style={{
                  background: "#1a1a1a",
                  animation: justAdded ? "popIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards" : "none",
                }}>
                {justAdded ? <CheckCircle size={15} /> : <ShoppingCart size={15} />}
                {justAdded ? "Added!" : "View Cart"}
              </button>
              <button onClick={handleShare}
                className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 transition-colors flex-shrink-0"
                title="Copy link">
                {copied ? <CheckCircle size={16} className="text-green-500" /> : <Share2 size={16} />}
              </button>
            </div>
          )}

          {/* Share when qty=0 */}
          {qty === 0 && (
            <div className="flex justify-end">
              <button onClick={handleShare}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy link">
                {copied ? <CheckCircle size={13} className="text-green-500" /> : <Share2 size={13} />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          )}

          <style>{`
            @keyframes slideInUp {
              from { opacity: 0; transform: translateY(10px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes popIn {
              0%   { opacity: 0; transform: scale(0.8); }
              60%  { transform: scale(1.06); }
              100% { opacity: 1; transform: scale(1); }
            }
            .product-desc p            { margin-bottom: 0.75em; }
            .product-desc p:last-child  { margin-bottom: 0; }
            .product-desc h1, .product-desc h2, .product-desc h3,
            .product-desc h4, .product-desc h5, .product-desc h6 {
              font-weight: 700; color: #111827; margin: 1em 0 0.4em;
            }
            .product-desc h1 { font-size: 1.25rem; }
            .product-desc h2 { font-size: 1.1rem; }
            .product-desc h3 { font-size: 1rem; }
            .product-desc ul { list-style: disc; padding-left: 1.4em; margin-bottom: 0.75em; }
            .product-desc ol { list-style: decimal; padding-left: 1.4em; margin-bottom: 0.75em; }
            .product-desc li { margin-bottom: 0.25em; }
            .product-desc b, .product-desc strong { font-weight: 700; color: #1f2937; }
            .product-desc i, .product-desc em { font-style: italic; }
            .product-desc u  { text-decoration: underline; }
            .product-desc a  { color: #2382AA; text-decoration: underline; }
            .product-desc a:hover { opacity: 0.8; }
            .product-desc table { width: 100%; border-collapse: collapse; margin-bottom: 0.75em; font-size: 0.85em; }
            .product-desc th, .product-desc td { border: 1px solid #e5e7eb; padding: 0.4em 0.7em; text-align: left; }
            .product-desc th { background: #f9fafb; font-weight: 600; }
            .product-desc hr { border: none; border-top: 1px solid #e5e7eb; margin: 1em 0; }
            .product-desc blockquote { border-left: 3px solid #2382AA; padding-left: 1em; color: #6b7280; margin: 0.75em 0; }
            .product-desc img { max-width: 100%; border-radius: 0.5rem; margin: 0.5em 0; }
          `}</style>

          {/* Brand row — Snapdeal style */}
          {product.brand && (
            <Link
              to={product.brand.slug ? `/brands/${product.brand.slug}` : `/products?brandId=${product.brand.id}`}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 hover:border-[#2382AA] hover:bg-[#2382AA]/5 transition-all group"
            >
              {/* Brand logo */}
              <div className="w-12 h-12 rounded-xl border border-gray-100 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                {product.brand.logo ? (
                  <img
                    src={imgUrl(product.brand.logo)}
                    alt={product.brand.name}
                    className="w-10 h-10 object-contain"
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        `<span style="font-size:16px;font-weight:700;color:#2382AA">${product.brand!.name[0]}</span>`;
                    }}
                  />
                ) : (
                  <span className="text-base font-bold text-[#2382AA]">{product.brand.name[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400 mb-0.5">Sold by</p>
                <p className="text-sm font-bold text-gray-900 group-hover:text-[#2382AA] transition-colors leading-tight">
                  {product.brand.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">View all products from this brand</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-[#2382AA] transition-colors flex-shrink-0" />
            </Link>
          )}

          {/* Category tag */}
          {product.category && (
            <Link to={`/products?categoryId=${product.category.id}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-[#2382AA] hover:bg-[#2382AA]/5 transition-all group">
              <div className="w-12 h-12 rounded-xl border border-gray-100 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                {product.category.image ? (
                  <img
                    src={imgUrl(product.category.image)}
                    alt={product.category.name}
                    className="w-10 h-10 object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }}
                  />
                ) : null}
                <span className={`text-base font-bold text-[#2382AA] ${product.category.image ? "hidden" : ""}`}>
                  {product.category.name[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400 mb-0.5">Category</p>
                <p className="text-sm font-bold text-gray-900 group-hover:text-[#2382AA] transition-colors leading-tight">
                  {product.category.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">View all products in this category</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-[#2382AA] transition-colors flex-shrink-0" />
            </Link>
          )}

          {/* About this product */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">About this product</h3>
            {/* Unit/weight chips */}
            <div className="flex gap-2 flex-wrap mb-3">
              {product.unit && (
                <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700">{product.unit}</span>
              )}
              {product.weight && (
                <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700">{product.weight}</span>
              )}
              {product.sku && (
                <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500">SKU: {product.sku}</span>
              )}
              {product.isFeatured && (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">Featured</span>
              )}
            </div>
            {product.description && (
              <DescriptionBlock html={product.description} />
            )}
            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-3">
                <Tag size={12} className="text-gray-400 flex-shrink-0" />
                {product.tags.map(tag => (
                  <Link key={tag} to={`/products?q=${encodeURIComponent(tag)}`}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 hover:bg-[#2382AA]/10 hover:text-[#2382AA] transition-colors">
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Why shop with Grocare */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              {([
                { icon: <Tag size={18} className="text-[#2382AA]" />,        title: "Best Prices",    sub: "Lowest guaranteed" },
                { icon: <CheckCircle size={18} className="text-emerald-500" />, title: "100% Fresh",    sub: "Quality assured"   },
                { icon: <Truck size={18} className="text-amber-500" />,         title: "60-Min Delivery", sub: "Express to door"   },
              ] as { icon: React.ReactNode; title: string; sub: string }[]).map(({ icon, title, sub }) => (
                <div key={title} className="flex flex-col items-center text-center px-2 py-3 bg-gray-50">
                  <div className="mb-1.5">{icon}</div>
                  <p className="text-[11px] font-bold text-gray-800">{title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>


      {/* Reviews */}
      <ReviewsSection productId={product.id} />

      {/* Similar products — horizontal scroll carousel */}
      {product.similarItems && product.similarItems.length > 0 && (
        <SimilarCarousel items={product.similarItems} categoryId={product.category?.id} categoryName={product.category?.name} />
      )}

      {/* Back button */}
      <div className="mt-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    </div>
  );
}

// ── Reviews Section ───────────────────────────────────────────────────────────

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<string, number>;
}
interface ReviewItem {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: { name: string; avatar?: string };
}

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} className={i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />
      ))}
    </div>
  );
}

function ReviewsSection({ productId }: { productId: string }) {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/reviews/product/${productId}`);
      setStats(res.data.stats);
      setReviews(res.data.reviews || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      await api.post(`/reviews/product/${productId}`, { rating: myRating, comment: comment.trim() || undefined });
      setSubmitMsg("Review submitted! Thank you.");
      setShowForm(false);
      setComment("");
      load();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setSubmitMsg(typeof msg === "string" ? msg : "Could not submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    if (d > 30) return `${Math.floor(d/30)}mo ago`;
    if (d > 0)  return `${d}d ago`;
    const h = Math.floor(diff / 3600000);
    if (h > 0)  return `${h}h ago`;
    return "just now";
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Customer Reviews</h2>
        <button
          onClick={() => setShowForm(f => !f)}
          className="text-sm font-medium text-[#2382AA] hover:underline"
        >
          {showForm ? "Cancel" : "Write a Review"}
        </button>
      </div>

      {/* Submit feedback */}
      {submitMsg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
          submitMsg.includes("Thank") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}>
          {submitMsg}
        </div>
      )}

      {/* Write review form */}
      {showForm && (
        <div className="mb-6 bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">Your Rating</p>
          <div className="flex gap-1 mb-4">
            {[1,2,3,4,5].map(i => (
              <button key={i}
                onMouseEnter={() => setHoverRating(i)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setMyRating(i)}
              >
                <Star size={28}
                  className={i <= (hoverRating || myRating) ? "fill-amber-400 text-amber-400" : "text-gray-300 fill-gray-100"}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="Share your experience with this product (optional)"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2382AA]/30 resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-3 w-full py-2.5 bg-[#2382AA] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !stats || stats.totalReviews === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl">
          <Star size={36} className="text-gray-200 fill-gray-100 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">No reviews yet</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to share your experience</p>
        </div>
      ) : (
        <>
          {/* Rating summary */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-5 flex gap-6 items-center">
            <div className="text-center flex-shrink-0">
              <p className="text-5xl font-extrabold text-gray-900">{stats.averageRating.toFixed(1)}</p>
              <StarDisplay rating={Math.round(stats.averageRating)} size={16} />
              <p className="text-xs text-gray-400 mt-1">{stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5,4,3,2,1].map(star => {
                const count = stats.distribution[star] ?? 0;
                const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-4 text-right">{star}</span>
                    <Star size={10} className="fill-amber-400 text-amber-400 flex-shrink-0" />
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-4">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review list */}
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E1F1F9] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[#2382AA]">
                      {(r.user.name || "A")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800 truncate">{r.user.name || "Anonymous"}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(r.createdAt)}</span>
                    </div>
                    <StarDisplay rating={r.rating} size={12} />
                    {r.comment && (
                      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
