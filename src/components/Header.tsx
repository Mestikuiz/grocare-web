import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart, User, ChevronDown, ShoppingBag,
  LogOut, Wallet, Bell, ChevronLeft, ChevronRight, MapPin,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useCity } from "../context/CityContext";
import { useAuth } from "../context/AuthContext";
import SearchBar from "./SearchBar";
import { api, imgUrl } from "../api/client";

interface Category { id: string; name: string; }

// ── User Dropdown (shared desktop + mobile) ───────────────────────────────────
function UserDropdown({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden min-w-[200px]">
      {/* User info */}
      <div className="px-4 py-3.5 border-b border-gray-100"
        style={{ background: "linear-gradient(135deg,#f0f9ff,#e0f2fe)" }}>
        <p className="text-sm font-bold text-gray-800 truncate">{user?.name ?? "My Account"}</p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{user?.phone ?? ""}</p>
      </div>
      {[
        { to: "/profile",       icon: User,        label: "My Profile"     },
        { to: "/orders",        icon: ShoppingBag, label: "My Orders"      },
        { to: "/wallet",        icon: Wallet,      label: "Wallet & Coins" },
        { to: "/notifications", icon: Bell,        label: "Notifications"  },
      ].map(({ to, icon: Icon, label }) => (
        <Link key={to} to={to} onClick={onClose}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <Icon size={14} className="text-gray-400" /> {label}
        </Link>
      ))}
      <div className="border-t border-gray-100" />
      <button onClick={() => { logout(); onClose(); navigate("/"); }}
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition-colors">
        <LogOut size={14} /> Sign Out
      </button>
    </div>
  );
}

// ── Category Nav ──────────────────────────────────────────────────────────────
function CategoryNav({ categories }: { categories: Category[] }) {
  const location = useLocation();
  const scrollRef = useRef<HTMLUListElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => { el.removeEventListener("scroll", checkScroll); window.removeEventListener("resize", checkScroll); };
  }, [categories, checkScroll]);

  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });

  const activeCategory = new URLSearchParams(location.search).get("category");
  if (!categories.length) return null;

  return (
    <nav className="relative overflow-x-hidden" style={{ borderTop: "1px solid #f1f5f9" }}>
      {/* Left arrow */}
      {canLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center"
          style={{ background: "linear-gradient(to right,white 60%,transparent)", paddingRight: "12px" }}>
          <button onClick={() => scroll("left")}
            className="w-6 h-6 ml-2 rounded-full flex items-center justify-center shadow-md"
            style={{ background: "#2382AA" }}>
            <ChevronLeft size={14} className="text-white" />
          </button>
        </div>
      )}
      {/* Right arrow */}
      {canRight && (
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center"
          style={{ background: "linear-gradient(to left,white 60%,transparent)", paddingLeft: "12px" }}>
          <button onClick={() => scroll("right")}
            className="w-6 h-6 mr-2 rounded-full flex items-center justify-center shadow-md"
            style={{ background: "#2382AA" }}>
            <ChevronRight size={14} className="text-white" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 md:px-4">
        <ul ref={scrollRef}
          className="flex items-center overflow-x-auto gap-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {/* All */}
          <li className="flex-shrink-0">
            <Link to="/products"
              className="flex items-center px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 border-b-2"
              style={!activeCategory
                ? { color: "#2382AA", borderBottomColor: "#2382AA" }
                : { color: "#6b7280", borderBottomColor: "transparent" }}>
              All
            </Link>
          </li>
          {categories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <li key={cat.id} className="flex-shrink-0">
                <Link to={`/products?category=${cat.id}`}
                  className="flex items-center px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-all duration-200 border-b-2"
                  style={{ color: isActive ? "#2382AA" : "#6b7280", borderBottomColor: isActive ? "#2382AA" : "transparent" }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = "#2382AA";
                      (e.currentTarget as HTMLElement).style.borderBottomColor = "#2382AA";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = "#6b7280";
                      (e.currentTarget as HTMLElement).style.borderBottomColor = "transparent";
                    }
                  }}>
                  {cat.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

// ── Main Header ───────────────────────────────────────────────────────────────
export default function Header() {
  const { itemCount } = useCart();
  const { selectedCity, setShowCityPicker } = useCity();
  const { isLoggedIn, user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [scrolled,   setScrolled]   = useState(false);
  const [userOpen,   setUserOpen]   = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/categories").then(r => {
      const cats: Category[] = r.data?.data ?? r.data ?? [];
      setCategories(cats.filter((c: any) => !c.parentId));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.phone?.slice(-2) ?? "?";

  return (
    <header
      className="sticky top-0 z-40 bg-white transition-shadow duration-300"
      style={{ boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.10)" : "0 1px 0 #f1f5f9" }}
    >
      {/* ── Main row ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3 md:px-5 py-2.5 flex items-center gap-2 md:gap-3">

        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img src="/logo.png" alt="Grocare" className="h-8 md:h-9 w-auto object-contain" />
        </Link>

        {/* Location selector — visible on ALL screens (like Bazaar/Blinkit) */}
        <button
          onClick={() => setShowCityPicker(true)}
          className="flex-shrink-0 flex flex-col items-start group"
        >
          <div className="flex items-center gap-1 text-[10px] text-gray-400 leading-none mb-0.5">
            <MapPin size={10} style={{ color: "#2382AA" }} />
            <span>Select location</span>
          </div>
          <div className="flex items-center gap-0.5">
            <span className="text-xs md:text-sm font-bold leading-none max-w-[72px] md:max-w-[130px] truncate transition-colors group-hover:opacity-80"
              style={{ color: "#2382AA" }}>
              {selectedCity?.name ?? "Your city"}
            </span>
            <ChevronDown size={12} style={{ color: "#2382AA" }} />
          </div>
        </button>

        {/* Search bar — flex-1 takes remaining space */}
        <div className="flex-1 min-w-0">
          <SearchBar cityId={selectedCity?.id} />
        </div>

        {/* Cart */}
        <Link to="/cart"
          className="flex-shrink-0 relative w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Cart">
          <ShoppingCart size={21} />
          {itemCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
              style={{ background: "#2382AA" }}>
              {itemCount > 9 ? "9+" : itemCount}
            </span>
          )}
        </Link>

        {/* User */}
        <div ref={userRef} className="flex-shrink-0 relative">
          {!isLoggedIn ? (
            <Link to="/login"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label="Login">
              <User size={21} className="text-gray-600" />
            </Link>
          ) : (
            <>
              <button
                onClick={() => setUserOpen(v => !v)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
                aria-label="Account">
                {user?.avatar
                  ? <img src={imgUrl(user.avatar)} alt="" className="w-8 h-8 rounded-full object-cover" />
                  : <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow"
                      style={{ background: "linear-gradient(135deg,#2382AA,#1a6b8f)" }}>
                      {initials}
                    </div>
                }
              </button>

              {userOpen && (
                <div className="absolute right-0 mt-2 z-50"
                  style={{ animation: "fadeDown 0.18s ease-out" }}>
                  <UserDropdown onClose={() => setUserOpen(false)} />
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* ── Category pills row (all screen sizes) ─────────────────────── */}
      <CategoryNav categories={categories} />

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}
