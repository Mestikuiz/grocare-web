import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Shield, Clock, Truck, RotateCcw, ChevronRight } from "lucide-react";
import { api } from "../api/client";

interface Category { id: string; name: string; }
interface Brand    { id: string; name: string; slug?: string; }

const TRUST_BADGES = [
  { icon: Truck,      label: "Free Delivery",    sub: "Orders above Rs.999"  },
  { icon: Clock,      label: "60-Min Delivery",  sub: "Express to your door" },
  { icon: Shield,     label: "100% Secure",      sub: "Safe & encrypted"     },
  { icon: RotateCcw,  label: "Easy Returns",     sub: "Hassle-free returns"  },
];

const SOCIAL = [
  { label: "f",  title: "Facebook",  href: "#", bg: "#1877F2" },
  { label: "in", title: "Instagram", href: "#", bg: "#E1306C" },
  { label: "𝕏",  title: "X",         href: "#", bg: "#000000" },
  { label: "wa", title: "WhatsApp",  href: "#", bg: "#25D366" },
];

export default function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands,     setBrands]     = useState<Brand[]>([]);
  const [email,      setEmail]      = useState("");

  useEffect(() => {
    api.get("/categories").then(r => {
      const cats: Category[] = r.data?.data ?? r.data ?? [];
      setCategories(cats.filter((c: any) => !c.parentId).slice(0, 9));
    }).catch(() => {});
    api.get("/brands").then(r => {
      setBrands((r.data?.data ?? r.data ?? []).slice(0, 8));
    }).catch(() => {});
  }, []);

  return (
    <footer className="mt-20" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── Brand header strip ─────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #1D6E91 0%, #2382AA 50%, #2a9fd4 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-white text-xl font-bold mb-1">Pakistan's Smartest Grocery Delivery</h2>
              <p className="text-blue-100 text-sm opacity-90">Fresh produce & top brands — delivered in 60 minutes.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="#"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
                <img src="/appstore.png" alt="" className="h-5 w-auto" />
                App Store
              </a>
              <a href="#"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
                <img src="/playstore.png" alt="" className="h-5 w-auto" />
                Google Play
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Trust badges ───────────────────────────────────────── */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 py-1">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#EBF5FA" }}>
                  <Icon size={17} style={{ color: "#2382AA" }} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "#111827" }}>{label}</div>
                  <div className="text-xs" style={{ color: "#9ca3af" }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main footer body ───────────────────────────────────── */}
      <div style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-10">

            {/* ─ Brand column ─ */}
            <div className="col-span-2 md:col-span-4">
              <img
                src="/logo.png"
                alt="Grocare"
                className="h-11 object-contain mb-5"
              />
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#6b7280" }}>
                Pakistan's smartest grocery delivery — fresh produce, top brands,
                delivered to your door in 60 minutes or less.
              </p>

              {/* Contact */}
              <div className="space-y-2.5 mb-6">
                {[
                  { Icon: MapPin, text: "Karachi · Lahore · Islamabad" },
                  { Icon: Phone,  text: "0300-0000000"                 },
                  { Icon: Mail,   text: "support@grocare.pk"           },
                ].map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5 text-sm" style={{ color: "#6b7280" }}>
                    <Icon size={13} style={{ color: "#2382AA", flexShrink: 0 }} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              {/* Social icons */}
              <div className="flex items-center gap-2">
                {SOCIAL.map(s => (
                  <a key={s.title} href={s.href} title={s.title}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white transition-all duration-200 hover:scale-110 hover:-translate-y-0.5 hover:shadow-md"
                    style={{ background: s.bg }}>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* ─ Categories ─ */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xs font-bold mb-5 uppercase tracking-widest" style={{ color: "#2382AA", letterSpacing: "0.1em" }}>
                Categories
              </h3>
              <ul className="space-y-2.5">
                {categories.length === 0
                  ? [1,2,3,4,5].map(i => <li key={i} className="h-3 rounded animate-pulse bg-gray-200" style={{ width: `${60 + i * 8}px` }} />)
                  : categories.map(cat => (
                      <li key={cat.id}>
                        <Link to={`/products?category=${cat.id}`}
                          className="flex items-center gap-1 text-sm transition-colors duration-200 group"
                          style={{ color: "#4b5563" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#2382AA")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#4b5563")}>
                          <ChevronRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5 flex-shrink-0" style={{ color: "#2382AA" }} />
                          {cat.name}
                        </Link>
                      </li>
                    ))
                }
              </ul>
            </div>

            {/* ─ Brands ─ */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#2382AA", letterSpacing: "0.1em" }}>
                  Top Brands
                </h3>
                <Link to="/brands"
                  className="text-[10px] font-semibold transition-colors duration-200"
                  style={{ color: "#9ca3af" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#2382AA")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}>
                  All →
                </Link>
              </div>
              <ul className="space-y-2.5">
                {brands.length === 0
                  ? [1,2,3,4].map(i => <li key={i} className="h-3 rounded animate-pulse bg-gray-200" style={{ width: `${50 + i * 10}px` }} />)
                  : brands.map(b => (
                      <li key={b.id}>
                        <Link to={b.slug ? `/brands/${b.slug}` : `/products?brandId=${b.id}`}
                          className="flex items-center gap-1 text-sm transition-colors duration-200 group"
                          style={{ color: "#4b5563" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#2382AA")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#4b5563")}>
                          <ChevronRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5 flex-shrink-0" style={{ color: "#2382AA" }} />
                          {b.name}
                        </Link>
                      </li>
                    ))
                }
              </ul>
            </div>

            {/* ─ Quick Links ─ */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xs font-bold mb-5 uppercase tracking-widest" style={{ color: "#2382AA", letterSpacing: "0.1em" }}>
                Quick Links
              </h3>
              <ul className="space-y-2.5">
                {[
                  { label: "Home",          to: "/"         },
                  { label: "All Products",  to: "/products" },
                  { label: "All Brands",    to: "/brands"   },
                  { label: "My Orders",     to: "/orders"   },
                  { label: "My Account",    to: "/profile"  },
                  { label: "Track Order",   to: "/orders"   },
                  { label: "Contact Us",    to: "/"         },
                  { label: "FAQs",          to: "/"         },
                  { label: "Return Policy", to: "/"         },
                ].map(l => (
                  <li key={l.label}>
                    <Link to={l.to}
                      className="flex items-center gap-1 text-sm transition-colors duration-200 group"
                      style={{ color: "#4b5563" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#2382AA")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#4b5563")}>
                      <ChevronRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5 flex-shrink-0" style={{ color: "#2382AA" }} />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ─ Newsletter ─ */}
            <div className="col-span-2 md:col-span-2">
              <h3 className="text-xs font-bold mb-5 uppercase tracking-widest" style={{ color: "#2382AA", letterSpacing: "0.1em" }}>
                Newsletter
              </h3>
              <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
                Get exclusive deals and updates in your inbox.
              </p>
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none transition-all duration-200"
                  style={{ background: "#fff", border: "1.5px solid #e5e7eb", color: "#111827" }}
                  onFocus={e => (e.currentTarget.style.border = "1.5px solid #2382AA")}
                  onBlur={e => (e.currentTarget.style.border = "1.5px solid #e5e7eb")}
                />
                <button
                  onClick={() => setEmail("")}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md"
                  style={{ background: "linear-gradient(135deg, #2382AA, #1D6E91)" }}>
                  Subscribe
                </button>
              </div>

              {/* Payment methods */}
              <div className="mt-6">
                <p className="text-xs font-semibold mb-2.5 uppercase tracking-wide" style={{ color: "#9ca3af" }}>We Accept</p>
                <div className="flex flex-wrap gap-1.5">
                  {["COD", "JazzCash", "EasyPaisa"].map(p => (
                    <span key={p}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                      style={{ background: "#fff", color: "#374151", border: "1.5px solid #e5e7eb" }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────── */}
      <div style={{ background: "#ffffff" }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs" style={{ color: "#9ca3af" }}>
            © 2026 Grocare. All rights reserved. Made with ❤️ in Pakistan.
          </span>
          <div className="flex items-center gap-5 text-xs">
            {["Privacy Policy", "Terms of Service"].map(label => (
              <Link key={label} to="/"
                className="transition-colors duration-200"
                style={{ color: "#9ca3af" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#2382AA")}
                onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </footer>
  );
}
