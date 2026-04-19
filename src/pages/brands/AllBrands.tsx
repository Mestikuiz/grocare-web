import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Package } from "lucide-react";
import { api, imgUrl } from "../../api/client";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  isFeatured?: boolean;
}

function BrandSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center gap-3 animate-pulse">
      <div className="w-16 h-16 rounded-2xl bg-gray-100" />
      <div className="h-3 bg-gray-100 rounded w-20" />
    </div>
  );
}

export default function AllBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.get("/brands")
      .then(r => setBrands(r.data?.data ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogoError = (brandId: string) => {
    setLogoErrors(prev => ({ ...prev, [brandId]: true }));
  };

  const featured = brands.filter(b => b.isFeatured);
  const others   = brands.filter(b => !b.isFeatured);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-5">
        <Link to="/" className="hover:text-[#2382AA]">Home</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium">All Brands</span>
      </nav>

      <h1 className="text-xl font-bold text-gray-900 mb-1">Shop by Brand</h1>
      <p className="text-sm text-gray-500 mb-7">
        {loading ? "Loading…" : `${brands.length} brands available`}
      </p>

      {/* Featured Brands */}
      {(loading || featured.length > 0) && (
        <section className="mb-10">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
            Featured Brands
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <BrandSkeleton key={i} />)
              : featured.map(brand => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  hasError={logoErrors[brand.id]}
                  onError={() => handleLogoError(brand.id)}
                />
              ))
            }
          </div>
        </section>
      )}

      {/* All Brands */}
      {!loading && others.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
            All Brands
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {others.map(brand => (
              <BrandCard
                key={brand.id}
                brand={brand}
                hasError={logoErrors[brand.id]}
                onError={() => handleLogoError(brand.id)}
              />
            ))}
          </div>
        </section>
      )}

      {!loading && brands.length === 0 && (
        <div className="text-center py-24">
          <Package size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-500">No brands found</p>
        </div>
      )}
    </div>
  );
}

function BrandCard({
  brand,
  hasError,
  onError,
}: {
  brand: Brand;
  hasError: boolean;
  onError: () => void;
}) {
  const initials = brand.name.slice(0, 2).toUpperCase();

  return (
    <Link
      to={`/brands/${brand.slug}`}
      className="group bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2.5 hover:border-[#2382AA] hover:shadow-md transition-all duration-200"
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
        {brand.logo && !hasError ? (
          <img
            src={imgUrl(brand.logo)}
            alt={brand.name}
            className="w-full h-full object-contain p-1"
            onError={onError}
          />
        ) : (
          <div
            className="w-full h-full rounded-xl flex items-center justify-center text-base font-black text-white"
            style={{ background: "linear-gradient(135deg, #2382AA, #1a6b8f)" }}
          >
            {initials}
          </div>
        )}
      </div>
      <span className="text-[11px] font-semibold text-gray-700 text-center leading-tight line-clamp-2 group-hover:text-[#2382AA] transition-colors">
        {brand.name}
      </span>
    </Link>
  );
}
