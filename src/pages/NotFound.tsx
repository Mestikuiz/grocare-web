import { Link } from "react-router-dom";
import { Home, ShoppingBag, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">

        {/* 404 visual */}
        <div className="relative inline-block mb-8">
          <span className="text-[120px] font-black leading-none select-none"
            style={{ color: "#2382AA15", letterSpacing: "-0.05em" }}>
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #2382AA, #1a6a8a)" }}>
              <Search size={32} className="text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
            style={{ background: "#2382AA" }}
          >
            <Home size={15} />
            Go to Homepage
          </Link>
          <Link
            to="/products"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:border-[#2382AA] transition-colors"
          >
            <ShoppingBag size={15} />
            Browse Products
          </Link>
        </div>

        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 mx-auto mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={13} />
          Go back
        </button>
      </div>
    </div>
  );
}
