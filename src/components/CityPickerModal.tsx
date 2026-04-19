import { useState } from "react";
import { X, MapPin, ChevronDown, Check, Loader, Navigation } from "lucide-react";
import { useCity, type City } from "../context/CityContext";

type LocateState = "idle" | "loading" | "found" | "error" | "denied";

export default function CityPickerModal() {
  const { cities, selectedCity, setSelectedCity, showCityPicker, setShowCityPicker } = useCity();
  const [open, setOpen]               = useState(false);
  const [locateState, setLocateState] = useState<LocateState>("idle");
  const [locateMsg, setLocateMsg]     = useState("");
  const [_detectedArea, setDetectedArea] = useState(""); // full area string from geocoder

  const canClose = !!selectedCity;

  if (!showCityPicker) return null;

  // ── Match geocoded city name to our city list ─────────────────────────────
  const matchCity = (geocodedCity: string): City | null => {
    const lower = geocodedCity.toLowerCase();
    return cities.find(c =>
      lower.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(lower)
    ) ?? null;
  };

  // ── Locate Me — browser GPS + Nominatim reverse geocode ──────────────────
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocateState("error");
      setLocateMsg("Geolocation is not supported by your browser.");
      return;
    }

    setLocateState("loading");
    setLocateMsg("Detecting your location…");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // OpenStreetMap Nominatim — free, no API key
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address ?? {};

          // Extract city from various fields Nominatim may return
          const rawCity =
            addr.city ??
            addr.town ??
            addr.county ??
            addr.state_district ??
            addr.state ??
            "";

          const area = [addr.suburb, addr.neighbourhood, rawCity].filter(Boolean).join(", ");
          setDetectedArea(area);

          const matched = matchCity(rawCity);
          if (matched) {
            setSelectedCity(matched);
            setLocateState("found");
            setLocateMsg(`Located in ${matched.name}`);
          } else {
            // City not in our delivery list — show detected name + ask to pick manually
            setLocateState("error");
            setLocateMsg(
              rawCity
                ? `"${rawCity}" is outside our delivery area. Please select a city manually.`
                : "Could not detect your city. Please select manually."
            );
          }
        } catch {
          setLocateState("error");
          setLocateMsg("Could not detect your location. Please select manually.");
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocateState("denied");
          setLocateMsg("Location permission denied. Please select your city manually.");
        } else {
          setLocateState("error");
          setLocateMsg("Could not detect your location. Please select manually.");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => canClose && setShowCityPicker(false)}
      />

      {/* Modal card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #2382AA, #1a6a8a)" }} />

        <div className="p-7">
          {/* Close btn */}
          {canClose && (
            <button
              onClick={() => setShowCityPicker(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X size={15} className="text-gray-600" />
            </button>
          )}

          {/* Icon */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "#e8f4f9" }}
          >
            <MapPin size={24} style={{ color: "#2382AA" }} />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">Delivery address</h2>
          <p className="text-gray-500 text-sm mb-5">
            What's your city?{" "}
            <button
              onClick={handleLocateMe}
              disabled={locateState === "loading"}
              className="font-semibold hover:underline transition-colors inline-flex items-center gap-1"
              style={{ color: "#2382AA" }}
            >
              {locateState === "loading" ? (
                <><Loader size={12} className="animate-spin" /> Locating…</>
              ) : (
                <><Navigation size={12} /> Locate Me</>
              )}
            </button>
          </p>

          {/* Locate Me feedback */}
          {locateState !== "idle" && locateState !== "loading" && (
            <div
              className="mb-4 px-4 py-2.5 rounded-xl text-sm flex items-start gap-2"
              style={{
                background: locateState === "found" ? "#e8f4f9" : "#fff3f3",
                color:      locateState === "found" ? "#1a6a8a" : "#c0392b",
              }}
            >
              {locateState === "found"
                ? <Check size={15} className="mt-0.5 flex-shrink-0" />
                : <X size={15} className="mt-0.5 flex-shrink-0" />
              }
              <span>{locateMsg}</span>
            </div>
          )}

          {/* City dropdown label */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select City
          </label>

          {/* Custom dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3.5 border-2 rounded-xl text-left transition-colors"
              style={{ borderColor: open ? "#2382AA" : "#e5e7eb" }}
            >
              <div className="flex items-center gap-2">
                {selectedCity && <MapPin size={14} style={{ color: "#2382AA" }} />}
                <span className={selectedCity ? "text-gray-900 font-medium" : "text-gray-400"}>
                  {selectedCity?.name ?? "Select your city"}
                </span>
              </div>
              <ChevronDown
                size={17}
                className="text-gray-400 transition-transform duration-200"
                style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
              />
            </button>

            {/* Dropdown list */}
            {open && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl z-10 overflow-hidden">
                {cities.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-gray-400 text-center flex items-center justify-center gap-2">
                    <Loader size={14} className="animate-spin" style={{ color: "#2382AA" }} />
                    Loading cities…
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto">
                    {cities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => { setSelectedCity(city); setOpen(false); setLocateState("idle"); }}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors hover:bg-gray-50 border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: selectedCity?.id === city.id ? "#2382AA" : "#cbd5e1" }}
                          >
                            {city.name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{city.name}</p>
                            {city.nameUrdu && (
                              <p className="text-xs text-gray-400" dir="rtl">{city.nameUrdu}</p>
                            )}
                          </div>
                        </div>
                        {selectedCity?.id === city.id && (
                          <Check size={15} style={{ color: "#2382AA" }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm button */}
          <button
            onClick={() => selectedCity && setShowCityPicker(false)}
            disabled={!selectedCity}
            className="mt-5 w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-40"
            style={{ background: "#2382AA" }}
          >
            {selectedCity
              ? `✓  Deliver to ${selectedCity.name}`
              : "Select a city to continue"
            }
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            {cities.length > 0
              ? `We currently deliver in ${cities.length} cit${cities.length === 1 ? "y" : "ies"} across Pakistan`
              : "Loading delivery areas…"
            }
          </p>
        </div>
      </div>
    </div>
  );
}
