import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User, Phone, MapPin, ShoppingBag, Wallet, Star,
  Edit2, Check, X, Loader2, LogOut, Plus, Trash2, ChevronRight, Camera, Bell,
} from "lucide-react";
import { api, imgUrl } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Stats {
  totalOrders: number;
  totalSpent: number;
  walletBalance: number;
  coins: number;
}

interface Address {
  id: string;
  label?: string;
  fullAddress: string;
  area: string;
  city: string;
  isDefault?: boolean;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "#2382AA15" }}>
        <Icon size={17} style={{ color: "#2382AA" }} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-base font-bold text-gray-900">{value}</p>
        {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Inline edit field ─────────────────────────────────────────────────────────
function EditField({
  label, value, placeholder, type = "text", onSave,
}: {
  label: string; value: string; placeholder?: string; type?: string;
  onSave: (val: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      await onSave(draft.trim());
      setEditing(false);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => { setDraft(value); setEditing(false); setError(""); };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">{label}</p>
        {editing ? (
          <div className="space-y-1.5">
            <input
              type={type}
              value={draft}
              onChange={e => { setDraft(e.target.value); setError(""); }}
              onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]/30 focus:border-[#2382AA]"
              placeholder={placeholder}
            />
            {error && <p className="text-[11px] text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: "#2382AA" }}
              >
                {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                Save
              </button>
              <button onClick={handleCancel} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:border-gray-300">
                <X size={11} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium text-gray-800">{value || <span className="text-gray-400 italic">{placeholder ?? "Not set"}</span>}</p>
        )}
      </div>
      {!editing && (
        <button onClick={() => { setDraft(value); setEditing(true); }} className="mt-1 text-gray-400 hover:text-[#2382AA] transition-colors">
          <Edit2 size={14} />
        </button>
      )}
    </div>
  );
}

// ── Address card ──────────────────────────────────────────────────────────────
function AddressCard({ addr, onDelete }: { addr: Address; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Remove this address?")) return;
    setDeleting(true);
    try {
      await api.delete(`/addresses/${addr.id}`);
      onDelete(addr.id);
    } catch {}
    setDeleting(false);
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <MapPin size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#2382AA" }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-semibold text-gray-700">{addr.label ?? "Address"}</span>
          {addr.isDefault && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2382AA]/10 text-[#2382AA] font-semibold">Default</span>
          )}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          {addr.fullAddress}, {addr.area}, {addr.city}
        </p>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
      >
        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    </div>
  );
}

// ── Main Profile page ─────────────────────────────────────────────────────────
export default function Profile() {
  const { user, isLoggedIn, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [stats,        setStats]        = useState<Stats | null>(null);
  const [addresses,    setAddresses]    = useState<Address[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [addForm,  setAddForm]  = useState({ label: "Home", fullAddress: "", area: "", city: "" });
  const [addSaving, setAddSaving] = useState(false);
  const [addError,  setAddError]  = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) navigate("/login", { state: { from: "/profile" }, replace: true });
  }, [isLoggedIn]);

  // Load stats + addresses
  useEffect(() => {
    if (!isLoggedIn) return;
    Promise.all([
      api.get("/users/me/stats").catch(() => null),
      api.get("/addresses").catch(() => null),
    ]).then(([statsRes, addrRes]) => {
      if (statsRes) setStats(statsRes.data?.data ?? statsRes.data);
      if (addrRes) {
        const data: Address[] = addrRes.data?.data ?? addrRes.data ?? [];
        setAddresses(data);
      }
    }).finally(() => setLoadingStats(false));
  }, [isLoggedIn]);

  const handleSaveName = async (name: string) => {
    const res = await api.patch("/users/me", { name });
    updateUser({ name: res.data?.name ?? name });
  };

  const handleSaveEmail = async (email: string) => {
    const res = await api.patch("/users/me", { email });
    updateUser({ email: res.data?.email ?? email });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await api.post("/upload/image", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = uploadRes.data?.url;
      if (!url) throw new Error("Upload failed");
      await api.patch("/users/me", { avatar: url });
      updateUser({ avatar: url });
    } catch {}
    setAvatarUploading(false);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleAddAddress = async () => {
    if (!addForm.fullAddress.trim() || !addForm.area.trim() || !addForm.city.trim()) {
      setAddError("Please fill all fields."); return;
    }
    setAddError(""); setAddSaving(true);
    try {
      const res = await api.post("/addresses", { ...addForm, isDefault: addresses.length === 0 });
      const newAddr: Address = res.data?.data ?? res.data;
      setAddresses(prev => [...prev, newAddr]);
      setShowAddForm(false);
      setAddForm({ label: "Home", fullAddress: "", area: "", city: "" });
    } catch (e: any) {
      setAddError(e?.response?.data?.message ?? "Failed to add address.");
    } finally {
      setAddSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!isLoggedIn || !user) return null;

  const displayName = user.name ?? user.phone;
  const initials    = user.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : user.phone.slice(-2);

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-5">
        <Link to="/" className="hover:text-[#2382AA]">Home</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium">My Profile</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: avatar + nav ──────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Avatar card */}
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-6 text-center">
            {/* Clickable avatar with upload overlay */}
            <div
              className="relative w-20 h-20 mx-auto mb-3 cursor-pointer group"
              onClick={() => !avatarUploading && avatarInputRef.current?.click()}
            >
              {user.avatar ? (
                <img
                  src={imgUrl(user.avatar)}
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow"
                  style={{ background: "#2382AA" }}
                >
                  {initials}
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {avatarUploading
                  ? <Loader2 size={18} className="text-white animate-spin" />
                  : <Camera size={18} className="text-white" />}
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <p className="text-[10px] text-gray-400 mb-2">Tap photo to change</p>
            <h2 className="text-base font-bold text-gray-900">{displayName}</h2>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1">
              <Phone size={11} /> {user.phone}
            </p>
            {user.role && user.role !== "CUSTOMER" && (
              <span className="mt-2 inline-block text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold border border-amber-200">
                {user.role}
              </span>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {[
              { to: "/orders",        icon: ShoppingBag, label: "My Orders" },
              { to: "/wallet",        icon: Wallet,      label: "Wallet & Coins" },
              { to: "/notifications", icon: Bell,        label: "Notifications" },
            ].map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
              >
                <Icon size={15} style={{ color: "#2382AA" }} />
                {label}
                <ChevronRight size={13} className="ml-auto text-gray-300" />
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 w-full transition-colors"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>

        {/* ── Right: main content ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {loadingStats ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 h-16 animate-pulse" />
              ))
            ) : stats ? (
              <>
                <StatCard icon={ShoppingBag} label="Orders" value={String(stats.totalOrders)} />
                <StatCard icon={User}        label="Spent"  value={`Rs. ${(stats.totalSpent ?? 0).toLocaleString("en-PK")}`} />
                <StatCard icon={Wallet}      label="Wallet" value={`Rs. ${(stats.walletBalance ?? 0).toLocaleString("en-PK")}`} />
                <StatCard icon={Star}        label="Coins"  value={String(stats.coins ?? 0)} />
              </>
            ) : null}
          </div>

          {/* Profile info */}
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-2">
            <h3 className="text-sm font-bold text-gray-800 py-3 border-b border-gray-50">Personal Info</h3>

            {/* Phone — read only */}
            <div className="flex items-start gap-3 py-3 border-b border-gray-50">
              <div className="flex-1">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">Phone</p>
                <p className="text-sm font-medium text-gray-800">{user.phone}</p>
              </div>
              <span className="mt-1 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Verified</span>
            </div>

            <EditField
              label="Full Name"
              value={user.name ?? ""}
              placeholder="Enter your name"
              onSave={handleSaveName}
            />
            <EditField
              label="Email Address"
              value={user.email ?? ""}
              placeholder="Enter your email"
              type="email"
              onSave={handleSaveEmail}
            />
          </div>

          {/* Addresses */}
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-2">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <h3 className="text-sm font-bold text-gray-800">Saved Addresses</h3>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#2382AA] hover:underline"
                >
                  <Plus size={12} /> Add New
                </button>
              )}
            </div>

            {addresses.length === 0 && !showAddForm && (
              <p className="text-sm text-gray-400 italic py-4">No addresses saved yet.</p>
            )}

            {addresses.map(addr => (
              <AddressCard
                key={addr.id}
                addr={addr}
                onDelete={id => setAddresses(prev => prev.filter(a => a.id !== id))}
              />
            ))}

            {/* Add address form */}
            {showAddForm && (
              <div className="border-t border-gray-50 pt-4 space-y-3 pb-2">
                <div className="flex gap-2 mb-1">
                  {["Home", "Work", "Other"].map(l => (
                    <button
                      key={l}
                      onClick={() => setAddForm(f => ({ ...f, label: l }))}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors
                        ${addForm.label === l ? "border-[#2382AA] bg-[#2382AA] text-white" : "border-gray-200 text-gray-600"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={addForm.fullAddress}
                  onChange={e => setAddForm(f => ({ ...f, fullAddress: e.target.value }))}
                  placeholder="Full address *"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2382AA]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={addForm.area}
                    onChange={e => setAddForm(f => ({ ...f, area: e.target.value }))}
                    placeholder="Area *"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2382AA]"
                  />
                  <input
                    type="text"
                    value={addForm.city}
                    onChange={e => setAddForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="City *"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2382AA]"
                  />
                </div>
                {addError && <p className="text-xs text-red-500">{addError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleAddAddress}
                    disabled={addSaving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: "#2382AA" }}
                  >
                    {addSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Save
                  </button>
                  <button
                    onClick={() => { setShowAddForm(false); setAddError(""); setAddForm({ label: "Home", fullAddress: "", area: "", city: "" }); }}
                    className="px-4 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick action cards */}
          <div className="grid grid-cols-2 gap-3">
            <Link to="/orders"
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5 hover:border-[#2382AA]/30 transition-colors group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#2382AA15" }}>
                <ShoppingBag size={15} style={{ color: "#2382AA" }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">My Orders</p>
                <p className="text-[11px] text-gray-400">History & tracking</p>
              </div>
            </Link>
            <Link to="/wallet"
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5 hover:border-[#2382AA]/30 transition-colors group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f59e0b15" }}>
                <Wallet size={15} className="text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">Wallet</p>
                <p className="text-[11px] text-gray-400">Balance & coins</p>
              </div>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
