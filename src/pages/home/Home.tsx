import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, ArrowRight, Building2, BadgePercent, Flame, Smartphone,
  Leaf, Milk, Sandwich, Beef, GlassWater, Cookie, Droplets, Sparkles, Baby,
  PenLine, Wheat, Salad, ShoppingBasket,
} from "lucide-react";
import { api, imgUrl } from "../../api/client";
import ProductCard from "../../components/ProductCard";

interface Category { id: string; name: string; image?: string; }
interface Brand    { id: string; name: string; logo?: string; slug?: string; }
interface Product  { id: string; name: string; price: number; comparePrice?: number; images?: string[]; unit?: string; stock?: number; discountPercent?: number; brand?: { name: string }; category?: { name: string }; }
interface Banner   { id: string; title?: string; image: string; link?: string; }

// ── Hero Banner Carousel ───────────────────────────────────────────────────────
function HeroBanner({ banners }: { banners: Banner[] }) {
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => setIdx(i => (i + 1) % Math.max(banners.length, 1)), 4000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [banners.length]);

  if (!banners.length) {
    return (
      <div className="w-full h-56 md:h-80 rounded-2xl overflow-hidden flex items-center justify-center text-white font-bold text-2xl"
        style={{ background: "linear-gradient(135deg, #2382AA 0%, #1a6a8a 100%)" }}>
        <div className="text-center px-6">
          <div className="text-3xl md:text-5xl font-extrabold mb-3">Fresh Groceries</div>
          <div className="text-lg md:text-xl opacity-85">Delivered to your door in 60 minutes</div>
          <Link to="/products"
            className="mt-6 inline-block bg-white text-[#2382AA] font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
            Shop Now →
          </Link>
        </div>
      </div>
    );
  }

  const banner = banners[idx];
  return (
    <div className="relative w-full rounded-2xl overflow-hidden select-none bg-gray-50">
      {banner.link ? (
        <Link to={banner.link} className="block w-full">
          <img
            src={imgUrl(banner.image)}
            alt={banner.title ?? ""}
            className="w-full h-auto block"
          />
        </Link>
      ) : (
        <img
          src={imgUrl(banner.image)}
          alt={banner.title ?? ""}
          className="w-full h-auto block"
        />
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-6 bg-white shadow" : "w-1.5 bg-white/60"}`} />
          ))}
        </div>
      )}
      {/* Arrows */}
      {banners.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + banners.length) % banners.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center transition-colors">
            <ChevronLeft size={16} className="text-white" />
          </button>
          <button onClick={() => setIdx(i => (i + 1) % banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center transition-colors">
            <ChevronRight size={16} className="text-white" />
          </button>
        </>
      )}
    </div>
  );
}

// ── Category Grid ──────────────────────────────────────────────────────────────
const CAT_COLORS = ["#FFF3E0","#E8F5E9","#E3F2FD","#FCE4EC","#F3E5F5","#E0F7FA","#FFF8E1","#F1F8E9","#EDE7F6","#E8EAF6"];
function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Shop by Category</h2>
        <Link to="/products" className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all" style={{ color: "#2382AA" }}>
          View All <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
        {categories.slice(0, 20).map((cat, i) => (
          <Link key={cat.id} to={`/products?categoryId=${cat.id}`}
            className="flex flex-col items-center gap-2 group">
            <div className="w-full aspect-square rounded-2xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105"
              style={{ background: CAT_COLORS[i % CAT_COLORS.length] }}>
              {cat.image
                ? <img src={imgUrl(cat.image)} alt={cat.name} className="w-3/4 h-3/4 object-contain" />
                : getCatIcon(cat.name)
              }
            </div>
            <span className="text-[11px] text-center text-gray-600 leading-tight font-medium group-hover:text-[#2382AA] transition-colors">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function getCatIcon(name: string): React.ReactNode {
  const n = name.toLowerCase();
  const cls = "text-[#2382AA]";
  if (n.includes("fruit") || n.includes("vegetable")) return <Leaf size={22} className={cls} />;
  if (n.includes("dairy") || n.includes("egg")) return <Milk size={22} className={cls} />;
  if (n.includes("bakery") || n.includes("bread")) return <Sandwich size={22} className={cls} />;
  if (n.includes("meat") || n.includes("seafood")) return <Beef size={22} className={cls} />;
  if (n.includes("beverage") || n.includes("drink")) return <GlassWater size={22} className={cls} />;
  if (n.includes("snack")) return <Cookie size={22} className={cls} />;
  if (n.includes("personal") || n.includes("care")) return <Droplets size={22} className={cls} />;
  if (n.includes("household") || n.includes("clean")) return <Sparkles size={22} className={cls} />;
  if (n.includes("baby")) return <Baby size={22} className={cls} />;
  if (n.includes("station")) return <PenLine size={22} className={cls} />;
  if (n.includes("rice") || n.includes("grain")) return <Wheat size={22} className={cls} />;
  if (n.includes("oil") || n.includes("ghee")) return <Salad size={22} className={cls} />;
  if (n.includes("spice") || n.includes("masala")) return <Flame size={22} className={cls} />;
  return <ShoppingBasket size={22} className={cls} />;
}

// ── Horizontal Product Row ─────────────────────────────────────────────────────
function ProductRow({ title, products, browseLink }: { title: string; products: Product[]; browseLink?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  if (!products.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">{title}</h2>
        <div className="flex items-center gap-2">
          {browseLink && (
            <Link to={browseLink} className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all" style={{ color: "#2382AA" }}>
              Browse All <ArrowRight size={14} />
            </Link>
          )}
          <button onClick={() => scroll("left")}
            className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#2382AA] transition-colors hidden md:flex">
            <ChevronLeft size={14} className="text-gray-600" />
          </button>
          <button onClick={() => scroll("right")}
            className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#2382AA] transition-colors hidden md:flex">
            <ChevronRight size={14} className="text-gray-600" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {products.map(p => (
          <div key={p.id} className="flex-shrink-0 w-40 sm:w-44 md:w-48">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Brands Row ─────────────────────────────────────────────────────────────────
function BrandsRow({ brands }: { brands: Brand[] }) {
  if (!brands.length) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Shop by Brand</h2>
        <Link to="/brands" className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all" style={{ color: "#2382AA" }}>
          All Brands <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {brands.map(brand => (
          <Link key={brand.id} to={brand.slug ? `/brands/${brand.slug}` : `/products?brandId=${brand.id}`}
            className="group flex flex-col items-center gap-2 bg-white border border-gray-100 hover:border-[#2382AA] hover:shadow-md rounded-2xl p-3 transition-all duration-200">
            <div className="w-12 h-12 flex items-center justify-center">
              {brand.logo ? (
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="w-full h-full object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }}
                />
              ) : null}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xs font-bold ${brand.logo ? "hidden" : ""}`}
                style={{ background: "linear-gradient(135deg,#2382AA,#1a6b8f)" }}>
                {brand.name.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <span className="text-[10px] font-semibold text-gray-600 group-hover:text-[#2382AA] text-center leading-tight line-clamp-1 transition-colors">
              {brand.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Promo Banner ───────────────────────────────────────────────────────────────
function PromoBanner({ title, subtitle, color, icon, link }: {
  title: string; subtitle: string; color: string; icon: React.ReactNode; link?: string;
}) {
  const content = (
    <div className="w-full rounded-2xl overflow-hidden flex items-center justify-between px-8 py-7"
      style={{ background: color }}>
      <div className="flex-1 min-w-0 pr-6">
        <h3 className="text-white text-xl md:text-3xl font-extrabold mb-1">{title}</h3>
        <p className="text-white/80 text-sm md:text-base">{subtitle}</p>
        {link && (
          <span className="mt-4 inline-block bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
            Shop Now →
          </span>
        )}
      </div>
      <div className="flex-shrink-0 opacity-90">
        {icon}
      </div>
    </div>
  );
  return link ? <Link to={link}>{content}</Link> : content;
}

// ── Two-column mini banners ────────────────────────────────────────────────────
function MiniBanners() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <PromoBanner
        title="Made in Pakistan"
        subtitle="Support local brands & save more"
        color="#1a6a8a"
        icon={<Building2 size={80} strokeWidth={1} className="text-white/60" />}
        link="/products?tag=local"
      />
      <PromoBanner
        title="Super Savers"
        subtitle="Up to 40% off on daily essentials"
        color="#e05a00"
        icon={<BadgePercent size={80} strokeWidth={1} className="text-white/60" />}
        link="/products?discount=true"
      />
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function ProductRowSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-44 bg-white rounded-xl border border-gray-100 animate-pulse">
          <div className="bg-gray-100 aspect-square rounded-t-xl" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-2/3 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Home Component ────────────────────────────────────────────────────────
export default function Home() {
  const [banners, setBanners]         = useState<Banner[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [featured, setFeatured]       = useState<Product[]>([]);
  const [brands, setBrands]           = useState<Brand[]>([]);
  const [byCategory, setByCategory]   = useState<Record<string, Product[]>>({});
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    // Fetch in parallel
    api.get("/banners").then(r => setBanners(r.data?.data ?? r.data ?? [])).catch(() => {});
    api.get("/categories").then(r => {
      const cats: Category[] = r.data?.data ?? r.data ?? [];
      setCategories(cats.filter(c => !(c as any).parentId));
    }).catch(() => {});
    api.get("/products/featured").then(r => setFeatured(r.data?.data ?? r.data ?? [])).catch(() => {});
    api.get("/brands/featured").then(r => setBrands(r.data?.data ?? r.data ?? [])).catch(() => {});

    // Load a few category product rows
    loadCategoryProducts().catch(() => {});
  }, []);

  const loadCategoryProducts = async () => {
    setLoadingCats(true);
    try {
      const catsRes = await api.get("/categories");
      const cats: Category[] = catsRes.data?.data ?? catsRes.data ?? [];
      const topCats = cats.filter(c => !(c as any).parentId).slice(0, 6);

      const results = await Promise.allSettled(
        topCats.map(cat =>
          api.get("/products", { params: { categoryId: cat.id, limit: 12 } })
            .then(r => ({ catId: cat.id, products: r.data?.data ?? [] }))
        )
      );

      const map: Record<string, Product[]> = {};
      results.forEach(r => {
        if (r.status === "fulfilled" && r.value.products.length) {
          map[r.value.catId] = r.value.products;
        }
      });
      setByCategory(map);
    } catch {}
    setLoadingCats(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-5 py-5">
    <main className="bg-white rounded-3xl shadow-sm border border-gray-100 px-4 md:px-8 py-6 space-y-10">
      {/* Hero */}
      <HeroBanner banners={banners} />

      {/* Categories */}
      <CategoryGrid categories={categories} />

      {/* Featured / Best Prices */}
      {featured.length > 0
        ? <ProductRow title="Best Prices — Only at Grocare" products={featured} browseLink="/products" />
        : <ProductRowSkeleton />
      }

      {/* Brands */}
      <BrandsRow brands={brands} />

      {/* First promo banner */}
      <PromoBanner
        title="Premium Spices at Lowest Prices"
        subtitle="Authentic flavors, guaranteed quality — from Rs. 50"
        color="linear-gradient(135deg, #8B2500 0%, #C0392B 100%)"
        icon={<Flame size={80} strokeWidth={1} className="text-white/60" />}
        link="/products?categoryId=spices"
      />

      {/* Category rows */}
      {loadingCats && !Object.keys(byCategory).length && (
        <>
          <ProductRowSkeleton />
          <ProductRowSkeleton />
        </>
      )}
      {categories
        .filter(c => byCategory[c.id]?.length)
        .slice(0, 3)
        .map(cat => (
          <ProductRow
            key={cat.id}
            title={cat.name}
            products={byCategory[cat.id]}
            browseLink={`/products?categoryId=${cat.id}`}
          />
        ))
      }

      {/* Mini banners */}
      <MiniBanners />

      {/* More category rows */}
      {categories
        .filter(c => byCategory[c.id]?.length)
        .slice(3, 6)
        .map(cat => (
          <ProductRow
            key={cat.id}
            title={cat.name}
            products={byCategory[cat.id]}
            browseLink={`/products?categoryId=${cat.id}`}
          />
        ))
      }

      {/* Final CTA banner */}
      <PromoBanner
        title="Download Grocare App"
        subtitle="Get exclusive app deals, track orders live & more"
        color="linear-gradient(135deg, #2382AA 0%, #1a5f7a 100%)"
        icon={<Smartphone size={80} strokeWidth={1} className="text-white/60" />}
      />
    </main>
    </div>
  );
}
