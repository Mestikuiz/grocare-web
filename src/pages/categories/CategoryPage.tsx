import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ChevronRight, Package, ShoppingCart } from "lucide-react";
import { api, imgUrl } from "../../api/client";
import { useCity } from "../../context/CityContext";
import ProductCard from "../../components/ProductCard";

interface Category {
  id: string;
  name: string;
  nameUrdu?: string;
  image?: string;
  children?: Category[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  images: string[];
  unit: string;
  stock?: number;
}

interface Meta { total: number; pages: number; page: number; }

const SORTS = [
  { value: "createdAt_desc", label: "Newest"              },
  { value: "price_asc",      label: "Price: Low to High"  },
  { value: "price_desc",     label: "Price: High to Low"  },
];

const CAT_COLORS = [
  "#FFF3E0","#E8F5E9","#E3F2FD","#FCE4EC",
  "#F3E5F5","#E0F7FA","#FFF8E1","#F1F8E9",
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

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const { selectedCity } = useCity();
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = searchParams.get("sort") ?? "createdAt_desc";
  const page = Number(searchParams.get("page") ?? 1);

  const [category, setCategory]   = useState<Category | null>(null);
  const [products, setProducts]   = useState<Product[]>([]);
  const [meta, setMeta]           = useState<Meta | null>(null);
  const [loading, setLoading]     = useState(true);
  const [catLoading, setCatLoading] = useState(true);
  const [notFound, setNotFound]   = useState(false);

  const setParam = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, val);
    if (key !== "page") next.set("page", "1");
    setSearchParams(next, { replace: true });
  };

  // Load category info
  useEffect(() => {
    if (!id) return;
    setCatLoading(true);
    api.get(`/categories/${id}`)
      .then(r => {
        const d = r.data?.data ?? r.data;
        setCategory(d);
      })
      .catch(() => setNotFound(true))
      .finally(() => setCatLoading(false));
  }, [id]);

  // Load products for this category
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const [sortField, sortDir] = sort.split("_");
    api.get("/products", {
      params: {
        categoryId: id,
        page,
        limit: 20,
        sortField,
        sortDir,
        ...(selectedCity?.id && { cityId: selectedCity.id }),
      },
    })
      .then(r => {
        const d = r.data;
        setProducts(d.data ?? d.products ?? []);
        const m = d.meta ?? {};
        setMeta({ total: m.total ?? 0, page: m.page ?? 1, pages: m.pages ?? m.totalPages ?? 1 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, sort, page, selectedCity?.id]);

  if (notFound) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Package size={48} className="mx-auto text-gray-200 mb-4" />
        <h1 className="text-xl font-bold text-gray-700 mb-2">Category not found</h1>
        <Link to="/products" className="text-sm text-[#2382AA] hover:underline">Browse all products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 flex-wrap">
        <Link to="/" className="hover:text-[#2382AA]">Home</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-[#2382AA]">Products</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium">{category?.name ?? "Category"}</span>
      </nav>

      {/* Category hero */}
      {catLoading ? (
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse mb-6" />
      ) : category && (
        <div className="relative rounded-2xl overflow-hidden mb-6"
          style={{ background: "linear-gradient(135deg, #2382AA12, #2382AA04)" }}>
          <div className="relative z-10 flex items-center gap-5 px-6 py-6">
            {category.image ? (
              <img src={imgUrl(category.image)} alt={category.name}
                className="w-16 h-16 rounded-2xl object-contain bg-white border border-gray-100 p-2 shadow-sm flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0"
                style={{ background: CAT_COLORS[0] }}>
                <ShoppingCart size={28} className="text-[#2382AA]" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
              {category.nameUrdu && (
                <p className="text-sm text-gray-500 mt-0.5" dir="rtl">{category.nameUrdu}</p>
              )}
              {meta && (
                <p className="text-xs text-gray-400 mt-1.5">{meta.total} product{meta.total !== 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-categories */}
      {category?.children && category.children.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Sub-categories</p>
          <div className="flex gap-2 flex-wrap">
            {category.children.map((sub, i) => (
              <Link key={sub.id} to={`/categories/${sub.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 hover:border-[#2382AA] hover:shadow-sm transition-all bg-white text-sm font-medium text-gray-700 hover:text-[#2382AA]"
                style={{ background: CAT_COLORS[i % CAT_COLORS.length] + "80" }}>
                {sub.image && (
                  <img src={imgUrl(sub.image)} alt={sub.name} className="w-5 h-5 object-contain" />
                )}
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
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

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)
          : products.map(p => <ProductCard key={p.id} product={p} />)
        }
      </div>

      {products.length === 0 && !loading && (
        <div className="text-center py-20">
          <Package size={44} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-500">No products found in this category</p>
          <Link to="/products" className="inline-block mt-4 text-sm text-[#2382AA] hover:underline">
            Browse all products
          </Link>
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
