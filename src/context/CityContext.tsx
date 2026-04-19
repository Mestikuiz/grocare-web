import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../api/client";

export interface City { id: string; name: string; nameUrdu?: string; }

interface CityContextType {
  cities: City[];
  selectedCity: City | null;
  setSelectedCity: (city: City) => void;
  showCityPicker: boolean;
  setShowCityPicker: (v: boolean) => void;
}

const CityContext = createContext<CityContextType | null>(null);

export function CityProvider({ children }: { children: ReactNode }) {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCityState] = useState<City | null>(() => {
    try {
      const saved = localStorage.getItem("grocare_city");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    api.get("/cities").then(r => {
      const data: City[] = r.data?.data ?? r.data ?? [];
      setCities(data); // backend already returns only active cities
    }).catch(() => {});
  }, []);

  // Show picker on first visit (no city saved)
  useEffect(() => {
    if (!localStorage.getItem("grocare_city")) {
      setShowCityPicker(true);
    }
  }, []);

  const setSelectedCity = (city: City) => {
    setSelectedCityState(city);
    localStorage.setItem("grocare_city", JSON.stringify(city));
    setShowCityPicker(false);
  };

  return (
    <CityContext.Provider value={{ cities, selectedCity, setSelectedCity, showCityPicker, setShowCityPicker }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error("useCity must be inside CityProvider");
  return ctx;
}
