import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ChevronRight, Package } from "lucide-react";
import { api, imgUrl } from "../../api/client";
import { useCity } from "../../context/CityContext";
import ProductCard from "../../components/ProductCard";

interface Brand {
  id: string; name: string; slug: string;
  logo?: string; banner?: string; description?: string;
}
interface Product {
  id: string; name: string; price: number; comparePrice?: number;
  images: string[]; unit: string; stock?: number;
}
interface Meta { total: number; pages: number; page: number; }

const SORTS = [
  { value: "createdAt_desc", label: "Newest" },
  { value: "price_asc",      label: "Price: Low to High" },
  { value: "price_desc",     label: "Price: High to Low" },
];

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="bg-gray-100 aspect-square" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-8 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

export default function BrandPage() {
  const { slug } = useParams<{ slug: string }>();
  const { selectedCity } = useCity();
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = searchParams.get("sort") ?? "createdAt_desc";
  const page = Number(searchParams.get("page") ?? 1);

  const [brand, setBrand]       = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta]         = useState<Meta | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  const setParam = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, val);
    if (key !== "page") next.set("page", "1");
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (!slug) return;
    api.get(`/brands/${slug}`).then(r => {
      const b: Brand = r.data?.data ?? r.data;
      setBrand(b);
    }).catch(() => setNotFound(true));
  }, [slug]);

  useEffect(() => {
    if (!brand) return;
    setLoading(true);
    const [sortField, sortDir] = sort.split("_");
    api.get("/products", {
      params: {
        brandId: brand.id, page, limit: 20,
        sortField, sortDir,
        ...(selectedCity?.id && { cityId: selectedCity.id }),
      },
    }).then(r => {
      const d = r.data;
      setProducts(d.data ?? d.products ?? []);
      const m = d.meta ?? {};
      setMeta({ total: m.total ?? 0, page: m.page ?? 1, pages: m.pages ?? m.totalPages ?? 1 });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [brand, sort, page, selectedCity?.id]);

  if (notFound) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Package size={48} className="mx-auto text-gray-200 mb-4" />
        <h1 className="text-xl font-bold text-gray-700 mb-2">Brand not found</h1>
        <Link to="/products" className="text-sm text-[#2382AA] hover:underline">Browse all products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <Link to="/" className="hover:text-[#2382AA]">Home</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium">{brand?.name ?? "Brand"}</span>
      </nav>

      {/* Brand hero */}
      {brand ? (
        <div className="relative rounded-2xl overflow-hidden mb-8"
          style={{ background: "linear-gradient(135deg, #2382AA15, #2382AA05)" }}>
          {brand.banner && (
            <img src={imgUrl(brand.banner)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
          )}
          <div className="relative z-10 flex items-center gap-6 px-8 py-8">
            {brand.logo ? (
              <img src={imgUrl(brand.logo)} alt={brand.name}
                className="w-20 h-20 rounded-2xl object-contain bg-white border border-gray-100 p-2 shadow-sm" />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-sm"
                style={{ background: "#2382AA" }}>
                {brand.name[0]}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{brand.name}</h1>
              {brand.description && (
                <p className="text-sm text-gray-600 mt-1 max-w-lg">{brand.description}</p>
              )}
              {meta && (
                <p className="text-xs text-gray-400 mt-2">{meta.total} product{meta.total !== 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-36 bg-gray-100 rounded-2xl animate-pulse mb-8" />
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500 font-medium">
          {loading ? "Loading…" : `${meta?.total ?? 0} products`}
        </p>
        <select
          value={sort}
          onChange={e => setParam("sort", e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2382AA] bg-white"
        >
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)
          : products.map(p => <ProductCard key={p.id} product={p} />)
        }
      </div>

      {products.length === 0 && !loading && (
        <div className="text-center py-20">
          <Package size={44} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-500">No products found for this brand</p>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-[#2382AA] transition-colors">
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {meta.pages}</span>
          <button disabled={page >= meta.pages} onClick={() => setParam("page", String(page + 1))}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-[#2382AA] transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
