import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Tag, Box } from "lucide-react";
import { api, imgUrl } from "../api/client";

interface Brand    { id: string; name: string; logo?: string; }
interface Category { id: string; name: string; image?: string; }
interface Product  { id: string; name: string; price: number; images?: string[]; }

interface Props { cityId?: string; }

export default function SearchBar({ cityId }: Props) {
  const [query, setQuery]           = useState("");
  const [focused, setFocused]       = useState(false);
  const [brands, setBrands]         = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(false);
  const [noResult, setNoResult]     = useState(false);

  const inputRef  = useRef<HTMLInputElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const timer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate  = useNavigate();

  // Load default brands + categories when search opens with no query
  useEffect(() => {
    api.get("/brands/featured").then(r => setBrands(r.data?.data ?? r.data ?? [])).catch(() => {});
    api.get("/categories", { params: { parentId: "null" } }).then(r => {
      const cats = r.data?.data ?? r.data ?? [];
      setCategories(cats.filter((c: any) => !c.parentId).slice(0, 6));
    }).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setProducts([]); setNoResult(false); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params: any = { search: query, limit: 6 };
        if (cityId) params.cityId = cityId;
        const res = await api.get("/products", { params });
        const list: Product[] = res.data?.data ?? [];
        setProducts(list);
        setNoResult(list.length === 0);
      } catch { setNoResult(true); }
      setLoading(false);
    }, 300);
  }, [query, cityId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setFocused(false);
    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  const goTo = (url: string) => { setFocused(false); setQuery(""); navigate(url); };

  const showDropdown = focused;
  const showDefault  = showDropdown && !query.trim();
  const showResults  = showDropdown && !!query.trim();

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0">
      {/* Input */}
      <form onSubmit={handleSubmit}>
        <div
          className="flex w-full rounded-xl overflow-hidden border-2 transition-colors"
          style={{ borderColor: focused ? "#2382AA" : "#e5e7eb" }}
        >
          <div className="flex items-center pl-4 text-gray-400">
            <Search size={17} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="What are you looking for today?"
            className="flex-1 px-3 py-3 text-sm outline-none bg-white text-gray-800 placeholder-gray-400"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); setProducts([]); setNoResult(false); inputRef.current?.focus(); }}
              className="px-3 text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          )}
          <button type="submit"
            className="px-5 py-3 text-white text-sm font-semibold flex items-center gap-1.5 flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ background: "#2382AA" }}>
            <Search size={15} />
            <span className="hidden sm:block">Search</span>
          </button>
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-[70vh] overflow-y-auto" style={{ maxWidth: "100vw" }}>

          {/* ── Default state: brands + categories ── */}
          {showDefault && (
            <div className="p-5 space-y-5">
              {/* Popular Brands */}
              {brands.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Popular Brands</p>
                  <div className="flex gap-2 flex-wrap">
                    {brands.slice(0, 7).map(b => (
                      <button key={b.id} onClick={() => goTo(`/products?brandId=${b.id}`)}
                        className="flex items-center gap-2 border border-gray-100 hover:border-[#2382AA] rounded-xl px-3 py-2 transition-all hover:shadow-sm">
                        {b.logo
                          ? <img src={imgUrl(b.logo)} alt={b.name} className="h-7 w-14 object-contain" />
                          : <span className="text-xs font-semibold text-gray-700 px-1">{b.name}</span>
                        }
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Categories */}
              {categories.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Popular Categories</p>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <button key={cat.id} onClick={() => goTo(`/products?categoryId=${cat.id}`)}
                        className="flex items-center gap-2 border border-gray-100 hover:border-[#2382AA] rounded-xl px-2.5 py-2 transition-all hover:shadow-sm text-left">
                        {cat.image
                          ? <img src={imgUrl(cat.image)} alt={cat.name} className="w-7 h-7 object-contain rounded-lg flex-shrink-0" />
                          : <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#e8f4f9" }}>
                              <Box size={13} style={{ color: "#2382AA" }} />
                            </div>
                        }
                        <span className="text-xs font-medium text-gray-700 leading-tight line-clamp-2">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Search results ── */}
          {showResults && (
            <div>
              {loading && (
                <div className="px-5 py-4 space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-1.5 py-1">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && products.length > 0 && (
                <>
                  <div className="px-5 pt-4 pb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Products</p>
                  </div>
                  {products.map(p => (
                    <button key={p.id} onClick={() => goTo(`/products/${p.id}`)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden">
                        <img src={imgUrl(p.images?.[0])} alt={p.name}
                          className="w-full h-full object-contain p-1"
                          onError={e => { (e.target as HTMLImageElement).src = "/placeholder.png"; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                        <p className="text-xs font-semibold mt-0.5" style={{ color: "#2382AA" }}>
                          Rs. {p.price.toLocaleString("en-PK")}
                        </p>
                      </div>
                      <Tag size={13} className="text-gray-300 flex-shrink-0" />
                    </button>
                  ))}
                  <div className="px-5 py-3 border-t border-gray-50">
                    <button onClick={() => goTo(`/products?search=${encodeURIComponent(query)}`)}
                      className="text-sm font-semibold w-full text-center py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                      style={{ color: "#2382AA" }}>
                      See all results for "{query}" →
                    </button>
                  </div>
                </>
              )}

              {!loading && noResult && (
                <div className="px-5 py-10 text-center">
                  <div className="mb-3 flex justify-center"><Search size={36} className="text-gray-300" /></div>
                  <p className="text-gray-800 font-semibold text-sm">No results for "{query}"</p>
                  <p className="text-gray-400 text-xs mt-1">Try a different keyword or browse categories</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
