import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, SlidersHorizontal, ChevronRight, X } from "lucide-react";
import { api } from "../../api/client";
import { useCity } from "../../context/CityContext";
import ProductCard from "../../components/ProductCard";

interface Product {
  id: string; name: string; price: number; comparePrice?: number;
  images: string[]; unit: string; stock?: number;
  category?: { name: string };
}

interface Meta { total: number; page: number; limit: number; pages: number; }

const SORTS = [
  { value: "createdAt_desc", label: "Newest" },
  { value: "price_asc",      label: "Price: Low to High" },
  { value: "price_desc",     label: "Price: High to Low" },
  { value: "name_asc",       label: "Name: A–Z" },
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

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const { selectedCity } = useCity();
  const q       = params.get("q") ?? "";
  const sort    = params.get("sort") ?? "createdAt_desc";
  const page    = Number(params.get("page") ?? 1);

  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta]         = useState<Meta | null>(null);
  const [loading, setLoading]   = useState(false);

  const set = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    next.set(key, val);
    if (key !== "page") next.set("page", "1");
    setParams(next, { replace: true });
  };

  const fetchResults = useCallback(async () => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const [sortField, sortDir] = sort.split("_");
      const res = await api.get("/products", {
        params: {
          search: q, page, limit: 20,
          sortField, sortDir,
          ...(selectedCity?.id && { cityId: selectedCity.id }),
        },
      });
      const d = res.data;
      setProducts(d.data ?? d.products ?? []);
      const m = d.meta ?? {};
      setMeta({ total: m.total ?? 0, page: m.page ?? 1, limit: m.limit ?? 20, pages: m.pages ?? m.totalPages ?? 1 });
    } catch {
      setProducts([]); setMeta(null);
    }
    setLoading(false);
  }, [q, sort, page, selectedCity?.id]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <Link to="/" className="hover:text-[#2382AA]">Home</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium">
          {q ? `Search: "${q}"` : "Search"}
        </span>
      </nav>

      {/* Search bar */}
      <div className="relative max-w-lg mb-6">
        <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={q}
          onChange={e => set("q", e.target.value)}
          placeholder="Search groceries, brands, categories…"
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]/30 focus:border-[#2382AA]"
        />
        {q && (
          <button onClick={() => set("q", "")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Results header */}
      {q && (
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">
            {loading ? "Searching…" : meta
              ? <><span className="font-semibold text-gray-900">{meta.total}</span> results for "<span className="font-semibold text-gray-900">{q}</span>"</>
              : null}
          </p>

          {/* Sort + filter row */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select
              value={sort}
              onChange={e => set("sort", e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2382AA] bg-white"
            >
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Empty query state */}
      {!q && (
        <div className="text-center py-24">
          <SearchIcon size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-base font-semibold text-gray-600">Search for groceries</p>
          <p className="text-sm text-gray-400 mt-1">Try "milk", "Pepsi", "vegetables"</p>
        </div>
      )}

      {/* No results */}
      {q && !loading && products.length === 0 && meta && (
        <div className="text-center py-24">
          <SearchIcon size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-base font-semibold text-gray-600">No results for "{q}"</p>
          <p className="text-sm text-gray-400 mt-1">Try a different keyword or browse categories</p>
          <Link to="/products" className="inline-block mt-5 px-6 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: "#2382AA" }}>
            Browse All Products
          </Link>
        </div>
      )}

      {/* Grid */}
      {q && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)
            : products.map(p => <ProductCard key={p.id} product={p} />)
          }
        </div>
      )}

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            disabled={page <= 1}
            onClick={() => set("page", String(page - 1))}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-[#2382AA] transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {meta.pages}
          </span>
          <button
            disabled={page >= meta.pages}
            onClick={() => set("page", String(page + 1))}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-[#2382AA] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
