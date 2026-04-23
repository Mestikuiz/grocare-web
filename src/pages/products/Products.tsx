import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  SlidersHorizontal, ChevronDown, ChevronRight, X, Search, LayoutGrid, List,
  Plus, Minus,
} from "lucide-react";
import { api, imgUrl } from "../../api/client";
import { useCity } from "../../context/CityContext";
import { useCart } from "../../context/CartContext";
import ProductCard from "../../components/ProductCard";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Category { id: string; name: string; parentId: string | null; children?: Category[]; }
interface Brand    { id: string; name: string; logo?: string; }
interface Product  {
  id: string; name: string; price: number; comparePrice?: number;
  images?: string[]; unit?: string; stock?: number; discountPercent?: number;
  brand?: { name: string }; category?: { name: string };
}
interface Meta { total: number; page: number; limit: number; totalPages: number; pages?: number; }

const SORT_OPTIONS = [
  { value: "newest",       label: "Newest First" },
  { value: "price_asc",    label: "Price: Low to High" },
  { value: "price_desc",   label: "Price: High to Low" },
  { value: "name_asc",     label: "Name A-Z" },
  { value: "popular",      label: "Most Popular" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildTree(cats: Category[]): Category[] {
  const map: Record<string, Category> = {};
  cats.forEach(c => { map[c.id] = { ...c, children: [] }; });
  const roots: Category[] = [];
  cats.forEach(c => {
    if (c.parentId && map[c.parentId]) map[c.parentId].children!.push(map[c.id]);
    else roots.push(map[c.id]);
  });
  return roots;
}

// ── Category tree node ────────────────────────────────────────────────────────
function CategoryNode({
  cat, selectedId, onSelect, depth,
}: { cat: Category; selectedId: string | null; onSelect: (id: string | null) => void; depth: number }) {
  const [open, setOpen] = useState(false);
  const hasChildren = (cat.children?.length ?? 0) > 0;
  const isActive = selectedId === cat.id;

  // Auto-expand if a child is active
  useEffect(() => {
    if (cat.children?.some(c => c.id === selectedId || c.children?.some(cc => cc.id === selectedId))) {
      setOpen(true);
    }
  }, [selectedId, cat.children]);

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer transition-colors text-sm
          ${isActive ? "bg-[#2382AA]/10 text-[#2382AA] font-semibold" : "text-gray-700 hover:bg-gray-100"}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => {
          if (isActive) onSelect(null);
          else onSelect(cat.id);
          if (hasChildren) setOpen(v => !v);
        }}
      >
        {hasChildren ? (
          <span className="flex-shrink-0 text-gray-400">
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}
        <span className="truncate">{cat.name}</span>
      </div>
      {open && hasChildren && (
        <div>
          {cat.children!.map(child => (
            <CategoryNode key={child.id} cat={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({
  categories, brands, selectedCategoryId, selectedBrandIds, priceRange, inStock,
  onCategory, onBrand, onPrice, onInStock, onClear, hasFilters,
}: {
  categories: Category[];
  brands: Brand[];
  selectedCategoryId: string | null;
  selectedBrandIds: string[];
  priceRange: [number, number];
  inStock: boolean;
  onCategory: (id: string | null) => void;
  onBrand: (id: string, checked: boolean) => void;
  onPrice: (range: [number, number]) => void;
  onInStock: (v: boolean) => void;
  onClear: () => void;
  hasFilters: boolean;
}) {
  const [catOpen, setCatOpen]     = useState(true);
  const [brandOpen, setBrandOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const tree = buildTree(categories);

  return (
    <aside className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
          <SlidersHorizontal size={14} /> Filters
        </span>
        {hasFilters && (
          <button onClick={onClear} className="text-xs text-[#2382AA] hover:underline flex items-center gap-0.5">
            <X size={11} /> Clear all
          </button>
        )}
      </div>

      {/* In Stock */}
      <div className="px-4 py-3 border-b border-gray-100">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <div
            className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${inStock ? "bg-[#2382AA]" : "bg-gray-200"}`}
            onClick={() => onInStock(!inStock)}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${inStock ? "left-4" : "left-0.5"}`} />
          </div>
          <span className="text-sm text-gray-700">In Stock Only</span>
        </label>
      </div>

      {/* Categories */}
      <div className="border-b border-gray-100">
        <button
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-800"
          onClick={() => setCatOpen(v => !v)}
        >
          Categories
          {catOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {catOpen && (
          <div className="px-1 pb-2 max-h-64 overflow-y-auto">
            {tree.map(cat => (
              <CategoryNode
                key={cat.id} cat={cat} selectedId={selectedCategoryId}
                onSelect={onCategory} depth={0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className="border-b border-gray-100">
          <button
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-800"
            onClick={() => setBrandOpen(v => !v)}
          >
            Brands
            {brandOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {brandOpen && (
            <div className="px-4 pb-3 max-h-52 overflow-y-auto space-y-1">
              {brands.map(brand => (
                <label key={brand.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedBrandIds.includes(brand.id)}
                    onChange={e => onBrand(brand.id, e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 accent-[#2382AA]"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate">{brand.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Price range */}
      <div>
        <button
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-800"
          onClick={() => setPriceOpen(v => !v)}
        >
          Price Range
          {priceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {priceOpen && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-wide">Min (Rs.)</label>
                <input
                  type="number" min={0} value={priceRange[0]}
                  onChange={e => onPrice([+e.target.value, priceRange[1]])}
                  className="w-full mt-0.5 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2382AA]"
                  placeholder="0"
                />
              </div>
              <span className="mt-4 text-gray-400">–</span>
              <div className="flex-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-wide">Max (Rs.)</label>
                <input
                  type="number" min={0} value={priceRange[1] || ""}
                  onChange={e => onPrice([priceRange[0], +e.target.value])}
                  className="w-full mt-0.5 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2382AA]"
                  placeholder="Any"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-3.5 bg-gray-100 rounded w-4/5" />
        <div className="h-3.5 bg-gray-100 rounded w-3/5" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-5 bg-gray-100 rounded w-1/3" />
          <div className="h-8 w-8 bg-gray-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Mobile drawer backdrop ────────────────────────────────────────────────────
function MobileFilterDrawer({
  open, onClose, children,
}: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-white overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold">Filters</span>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-2">{children}</div>
      </div>
    </div>
  );
}

// ── Main Products page ────────────────────────────────────────────────────────
export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedCity } = useCity();

  // URL-driven state
  const categoryId    = searchParams.get("category") ?? "";
  const brandIds      = searchParams.getAll("brand");
  const search        = searchParams.get("q") ?? "";
  const sortBy        = searchParams.get("sort") ?? "newest";
  const page          = parseInt(searchParams.get("page") ?? "1", 10);
  const minPriceParam = searchParams.get("minPrice") ? +searchParams.get("minPrice")! : 0;
  const maxPriceParam = searchParams.get("maxPrice") ? +searchParams.get("maxPrice")! : 0;
  const inStockParam  = searchParams.get("inStock") === "true";

  // Data
  const [products,   setProducts]   = useState<Product[]>([]);
  const [meta,       setMeta]       = useState<Meta>({ total: 0, page: 1, limit: 24, totalPages: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands,     setBrands]     = useState<Brand[]>([]);
  const [loading,    setLoading]    = useState(true);

  // Local search input (debounced)
  const [searchInput, setSearchInput] = useState(search);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mobile filter drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Price range local state (applied on blur / enter)
  const [priceRange, setPriceRange] = useState<[number, number]>([minPriceParam, maxPriceParam]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch products
  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {
      page: String(page),
      limit: "24",
      sortBy,
    };
    if (categoryId)      params.categoryId = categoryId;
    if (brandIds.length) params.brandId    = brandIds[0]; // backend supports one brandId for now
    if (search)          params.search     = search;
    if (minPriceParam)   params.minPrice   = String(minPriceParam);
    if (maxPriceParam)   params.maxPrice   = String(maxPriceParam);
    if (inStockParam)    params.inStock    = "true";
    if (selectedCity?.id) params.cityId   = selectedCity.id;

    api.get("/products", { params })
      .then(r => {
        const d = r.data;
        setProducts(d.data ?? d.products ?? d ?? []);
        const raw = d.meta ?? {};
        setMeta({
          total: raw.total ?? d.total ?? 0,
          page:  raw.page ?? page,
          limit: raw.limit ?? 24,
          totalPages: raw.totalPages ?? raw.pages ?? Math.ceil((raw.total ?? d.total ?? 0) / 24),
        });
      })
      .catch(() => { setProducts([]); })
      .finally(() => setLoading(false));
  }, [categoryId, brandIds.join(","), search, sortBy, page, minPriceParam, maxPriceParam, inStockParam, selectedCity?.id]);

  // Fetch categories + brands once
  useEffect(() => {
    api.get("/categories").then(r => {
      const data: Category[] = r.data?.data ?? r.data ?? [];
      setCategories(data);
    }).catch(() => {});
    api.get("/brands").then(r => {
      const data: Brand[] = r.data?.data ?? r.data ?? [];
      setBrands(data);
    }).catch(() => {});
  }, []);

  // Sync search input with URL
  useEffect(() => { setSearchInput(search); }, [search]);
  // Sync price range with URL
  useEffect(() => { setPriceRange([minPriceParam, maxPriceParam]); }, [minPriceParam, maxPriceParam]);

  // Helpers to update URL
  const updateParam = useCallback((key: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      next.delete("page"); // reset page on filter change
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleCategory = (id: string | null) => updateParam("category", id);
  const handleSort     = (v: string) => updateParam("sort", v === "newest" ? null : v);
  const handleInStock  = (v: boolean) => updateParam("inStock", v ? "true" : null);

  const handleBrand = (id: string, checked: boolean) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete("brand");
      const current = prev.getAll("brand").filter(b => b !== id);
      const updated = checked ? [...current, id] : current;
      updated.forEach(b => next.append("brand", b));
      next.delete("page");
      return next;
    }, { replace: true });
  };

  const handlePriceApply = (range: [number, number]) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (range[0]) next.set("minPrice", String(range[0])); else next.delete("minPrice");
      if (range[1]) next.set("maxPrice", String(range[1])); else next.delete("maxPrice");
      next.delete("page");
      return next;
    }, { replace: true });
  };

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      updateParam("q", val || null);
    }, 350);
  };

  const handleClearAll = () => {
    setSearchParams({}, { replace: true });
    setPriceRange([0, 0]);
    setSearchInput("");
  };

  const goPage = (p: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("page", String(p));
      return next;
    }, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasFilters = !!(categoryId || brandIds.length || search || inStockParam || minPriceParam || maxPriceParam);

  // Category breadcrumb
  const selectedCat = categoryId ? categories.find(c => c.id === categoryId) : null;

  const sidebarProps = {
    categories, brands,
    selectedCategoryId: categoryId || null,
    selectedBrandIds: brandIds,
    priceRange,
    inStock: inStockParam,
    onCategory: handleCategory,
    onBrand: handleBrand,
    onPrice: (range: [number, number]) => {
      setPriceRange(range);
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
      searchDebounce.current = setTimeout(() => handlePriceApply(range), 600);
    },
    onInStock: handleInStock,
    onClear: handleClearAll,
    hasFilters,
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <Link to="/" className="hover:text-[#2382AA]">Home</Link>
        <ChevronRight size={12} />
        {selectedCat ? (
          <>
            <Link to="/products" className="hover:text-[#2382AA]">Products</Link>
            <ChevronRight size={12} />
            <span className="text-gray-800 font-medium">{selectedCat.name}</span>
          </>
        ) : (
          <span className="text-gray-800 font-medium">All Products</span>
        )}
      </nav>

      {/* Search bar (top) */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search products…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]/30 focus:border-[#2382AA]"
        />
        {searchInput && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex gap-6">

        {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <Sidebar {...sidebarProps} />
        </div>

        {/* ── Mobile filter drawer ─────────────────────────────────────────── */}
        <MobileFilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Sidebar {...sidebarProps} />
        </MobileFilterDrawer>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Mobile filter button */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300"
              >
                <SlidersHorizontal size={14} /> Filters
                {hasFilters && (
                  <span className="ml-0.5 bg-[#2382AA] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {[categoryId, ...brandIds, inStockParam ? "1" : "", minPriceParam ? "1" : ""].filter(Boolean).length}
                  </span>
                )}
              </button>

              <span className="text-sm text-gray-500">
                {loading ? "Loading…" : `${meta.total.toLocaleString()} product${meta.total !== 1 ? "s" : ""}`}
              </span>

              {/* Active filter chips */}
              {hasFilters && (
                <div className="flex gap-1.5 flex-wrap">
                  {selectedCat && (
                    <FilterChip label={selectedCat.name} onRemove={() => handleCategory(null)} />
                  )}
                  {brandIds.map(bid => {
                    const b = brands.find(br => br.id === bid);
                    return b ? <FilterChip key={bid} label={b.name} onRemove={() => handleBrand(bid, false)} /> : null;
                  })}
                  {inStockParam && <FilterChip label="In Stock" onRemove={() => handleInStock(false)} />}
                  {(minPriceParam > 0 || maxPriceParam > 0) && (
                    <FilterChip
                      label={`Rs. ${minPriceParam || "0"} – ${maxPriceParam || "∞"}`}
                      onRemove={() => handlePriceApply([0, 0])}
                    />
                  )}
                  {search && <FilterChip label={`"${search}"`} onRemove={() => handleSearchChange("")} />}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => handleSort(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#2382AA] cursor-pointer"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* View toggle */}
              <div className="hidden sm:flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-[#2382AA] text-white" : "text-gray-500 hover:bg-gray-50"}`}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-[#2382AA] text-white" : "text-gray-500 hover:bg-gray-50"}`}
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Product grid / list */}
          {loading ? (
            <div className={`grid gap-4 ${viewMode === "grid"
              ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"}`}>
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onClear={handleClearAll} />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {products.map(p => <ProductListRow key={p.id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {!loading && meta.totalPages > 1 && (
            <Pagination current={page} total={meta.totalPages} onPage={goPage} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Filter chip ───────────────────────────────────────────────────────────────
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#2382AA]/10 text-[#2382AA] text-xs font-medium px-2 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:opacity-70">
        <X size={10} />
      </button>
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">No products found</h3>
      <p className="text-gray-500 text-sm mb-4">
        {hasFilters ? "Try adjusting or clearing your filters." : "No products are available right now."}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: "#2382AA" }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

// ── List row view ─────────────────────────────────────────────────────────────
function ProductListRow({ product }: { product: Product }) {
  const { addItem, removeItem, getQty } = useCart();
  const qty = getQty(product.id);
  const image = product.images?.[0];
  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all flex items-center gap-4 p-3"
    >
      <div className="relative w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
        <img
          src={imgUrl(image)}
          alt={product.name}
          className="w-full h-full object-contain p-1.5"
          onError={e => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
        />
        {discount > 0 && (
          <span className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1 rounded">
            -{discount}%
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {product.brand && <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{product.brand.name}</div>}
        <div className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{product.name}</div>
        {product.unit && <div className="text-xs text-gray-400 mt-0.5">{product.unit}</div>}
        {product.category && <div className="text-xs text-gray-400 mt-0.5">{product.category.name}</div>}
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-2" onClick={e => e.preventDefault()}>
        <div className="text-right">
          <div className="text-base font-bold" style={{ color: "#2382AA" }}>
            Rs. {product.price.toLocaleString("en-PK")}
          </div>
          {product.comparePrice && product.comparePrice > product.price && (
            <div className="text-xs text-gray-400 line-through">
              Rs. {product.comparePrice.toLocaleString("en-PK")}
            </div>
          )}
        </div>
        {qty > 0 ? (
          <div className="flex items-center gap-1 rounded-lg overflow-hidden border" style={{ borderColor: "#2382AA" }}>
            <button onClick={() => removeItem(product.id)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-50" style={{ color: "#2382AA" }}>
              <Minus size={12} />
            </button>
            <span className="text-sm font-semibold min-w-[20px] text-center" style={{ color: "#2382AA" }}>{qty}</span>
            <button onClick={() => addItem(product.id, product)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-50" style={{ color: "#2382AA" }}>
              <Plus size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => addItem(product.id, product)}
            disabled={(product.stock ?? 1) === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
            style={{ background: "#2382AA" }}
          >
            Add
          </button>
        )}
      </div>
    </Link>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ current, total, onPage }: { current: number; total: number; onPage: (p: number) => void }) {
  const pages: (number | "…")[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push("…");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("…");
    pages.push(total);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        disabled={current === 1}
        onClick={() => onPage(current - 1)}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ← Prev
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
              ${p === current ? "text-white" : "text-gray-700 hover:bg-gray-100 border border-gray-200"}`}
            style={p === current ? { background: "#2382AA" } : {}}
          >
            {p}
          </button>
        )
      )}
      <button
        disabled={current === total}
        onClick={() => onPage(current + 1)}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  );
}
