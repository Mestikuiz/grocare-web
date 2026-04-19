import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Shield, Clock, Truck, RotateCcw } from "lucide-react";
import { api } from "../api/client";

interface Category { id: string; name: string; }
interface Brand    { id: string; name: string; slug?: string; }

const DOT_PATTERN = `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='%232382AA' fill-opacity='0.12'/%3E%3C/svg%3E")`;

const TRUST_BADGES = [
  { icon: Truck,      label: "Free Delivery",    sub: "On orders above Rs.999" },
  { icon: Clock,      label: "60-Min Delivery",  sub: "Express to your door"   },
  { icon: Shield,     label: "100% Secure",      sub: "Safe & encrypted"       },
  { icon: RotateCcw,  label: "Easy Returns",     sub: "Hassle-free returns"    },
];

const SOCIAL = [
  { label: "f",  title: "Facebook",  href: "#", color: "#1877F2" },
  { label: "in", title: "Instagram", href: "#", color: "#E1306C" },
  { label: "𝕏",  title: "X",         href: "#", color: "#ffffff" },
  { label: "wa", title: "WhatsApp",  href: "#", color: "#25D366" },
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

      {/* ── Wave separator ─────────────────────────────────────── */}
      <div style={{ lineHeight: 0, background: "#fff" }}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 60 }}>
          <path d="M0,0 C360,60 1080,60 1440,0 L1440,60 L0,60 Z" fill="#0d1b2a" />
        </svg>
      </div>

      {/* ── Trust badges strip ─────────────────────────────────── */}
      <div style={{ background: "#0d1b2a", backgroundImage: DOT_PATTERN }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div key={label}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: "rgba(35,130,170,0.08)", border: "1px solid rgba(35,130,170,0.18)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(35,130,170,0.18)" }}>
                  <Icon size={18} style={{ color: "#2382AA" }} />
                </div>
                <div>
                  <div className="text-white font-semibold text-xs">{label}</div>
                  <div className="text-xs" style={{ color: "#6b8fa8" }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main footer body ───────────────────────────────────── */}
      <div style={{ background: "#0d1b2a", backgroundImage: DOT_PATTERN }}>
        {/* thin teal divider */}
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #2382AA55, transparent)" }} />

        <div className="max-w-7xl mx-auto px-4 py-14">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-10">

            {/* ─ Brand column ─ */}
            <div className="col-span-2 md:col-span-4">
              {/* Logo: mix-blend-mode screen removes white bg on dark */}
              <img
                src="/logo.png"
                alt="Grocare"
                className="h-12 object-contain mb-5"
                style={{ mixBlendMode: "screen", filter: "brightness(1.1)" }}
              />
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#7a9bb5" }}>
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
                  <div key={text} className="flex items-center gap-2.5 text-sm" style={{ color: "#7a9bb5" }}>
                    <Icon size={13} style={{ color: "#2382AA", flexShrink: 0 }} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              {/* Social icons */}
              <div className="flex items-center gap-2">
                {SOCIAL.map(s => (
                  <a key={s.title} href={s.href} title={s.title}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white transition-all duration-300 hover:scale-110 hover:-translate-y-0.5"
                    style={{ background: "#162535" }}
                    onMouseEnter={e => (e.currentTarget.style.background = s.color)}
                    onMouseLeave={e => (e.currentTarget.style.background = "#162535")}>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* ─ Categories ─ */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-white font-semibold text-xs mb-5 uppercase tracking-widest" style={{ letterSpacing: "0.12em" }}>
                Categories
              </h3>
              <ul className="space-y-2.5">
                {categories.length === 0
                  ? [1,2,3,4,5].map(i => <li key={i} className="h-3 rounded animate-pulse" style={{ background: "#1a2d3f", width: `${60 + i * 8}px` }} />)
                  : categories.map(cat => (
                      <li key={cat.id}>
                        <Link to={`/products?category=${cat.id}`}
                          className="text-sm transition-all duration-200 hover:translate-x-1 inline-block"
                          style={{ color: "#7a9bb5" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#2382AA")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#7a9bb5")}>
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
                <h3 className="text-white font-semibold text-xs uppercase tracking-widest" style={{ letterSpacing: "0.12em" }}>
                  Top Brands
                </h3>
                <Link to="/brands"
                  className="text-[10px] font-semibold transition-colors duration-200"
                  style={{ color: "#2382AA" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#5ab3d4")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#2382AA")}>
                  All →
                </Link>
              </div>
              <ul className="space-y-2.5">
                {brands.length === 0
                  ? [1,2,3,4].map(i => <li key={i} className="h-3 rounded animate-pulse" style={{ background: "#1a2d3f", width: `${50 + i * 10}px` }} />)
                  : brands.map(b => (
                      <li key={b.id}>
                        <Link to={b.slug ? `/brands/${b.slug}` : `/products?brandId=${b.id}`}
                          className="text-sm transition-all duration-200 hover:translate-x-1 inline-block"
                          style={{ color: "#7a9bb5" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#2382AA")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#7a9bb5")}>
                          {b.name}
                        </Link>
                      </li>
                    ))
                }
              </ul>
            </div>

            {/* ─ Quick Links ─ */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-white font-semibold text-xs mb-5 uppercase tracking-widest" style={{ letterSpacing: "0.12em" }}>
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
                      className="text-sm transition-all duration-200 hover:translate-x-1 inline-block"
                      style={{ color: "#7a9bb5" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#2382AA")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#7a9bb5")}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ─ Download App + Newsletter ─ */}
            <div className="col-span-2 md:col-span-2">
              <h3 className="text-white font-semibold text-xs mb-5 uppercase tracking-widest" style={{ letterSpacing: "0.12em" }}>
                Get the App
              </h3>
              <p className="text-xs mb-4" style={{ color: "#7a9bb5" }}>
                Exclusive app-only deals every day!
              </p>

              {/* Real store badges */}
              <div className="space-y-3 mb-8">
                <a href="#"
                  className="block transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg rounded-xl overflow-hidden"
                  style={{ maxWidth: 160 }}>
                  <img src="/appstore.png" alt="Download on the App Store" className="w-full h-auto rounded-xl" />
                </a>
                <a href="#"
                  className="block transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg rounded-xl overflow-hidden"
                  style={{ maxWidth: 160 }}>
                  <img src="/playstore.png" alt="Get it on Google Play" className="w-full h-auto rounded-xl" />
                </a>
              </div>

              {/* Newsletter */}
              <h3 className="text-white font-semibold text-xs mb-3 uppercase tracking-widest" style={{ letterSpacing: "0.12em" }}>
                Newsletter
              </h3>
              <p className="text-xs mb-3" style={{ color: "#7a9bb5" }}>Get deals & updates in your inbox.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 min-w-0 text-xs px-3 py-2 rounded-lg outline-none text-white placeholder-gray-600 transition-all duration-200"
                  style={{ background: "#162535", border: "1px solid #1e3547" }}
                  onFocus={e => (e.currentTarget.style.border = "1px solid #2382AA")}
                  onBlur={e => (e.currentTarget.style.border = "1px solid #1e3547")}
                />
                <button
                  onClick={() => setEmail("")}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all duration-200 hover:opacity-90 whitespace-nowrap"
                  style={{ background: "#2382AA" }}>
                  Join
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────── */}
      <div style={{ background: "#091420" }}>
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #2382AA33, transparent)" }} />
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs" style={{ color: "#4a6a80" }}>
            © 2026 Grocare. All rights reserved. Made with ❤️ in Pakistan.
          </span>
          <div className="flex items-center gap-5 text-xs" style={{ color: "#4a6a80" }}>
            <Link to="/"
              onMouseEnter={e => (e.currentTarget.style.color = "#2382AA")}
              onMouseLeave={e => (e.currentTarget.style.color = "#4a6a80")}
              className="transition-colors duration-200">Privacy Policy</Link>
            <Link to="/"
              onMouseEnter={e => (e.currentTarget.style.color = "#2382AA")}
              onMouseLeave={e => (e.currentTarget.style.color = "#4a6a80")}
              className="transition-colors duration-200">Terms of Service</Link>
            {/* Payment badges */}
            <div className="flex items-center gap-1.5">
              {["COD", "JazzCash", "EasyPaisa"].map(p => (
                <span key={p}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold"
                  style={{ background: "#162535", color: "#4a6a80", border: "1px solid #1e3547" }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
