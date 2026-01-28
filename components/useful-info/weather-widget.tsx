"use client";

import { useState } from "react";
import { CloudSun, Info, Thermometer, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherData {
  month: string;
  airTemp: number; // Celsius
  waterTemp: number; // Celsius
}

interface CountryWeather {
  id: string;
  name: string;
  flag: string;
  data: WeatherData[];
}

const MONTHS = [
  "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
  "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
];

// Mock data generator helper
const generateMockWeather = (baseAir: number, baseWater: number): WeatherData[] => {
  return MONTHS.map((month, index) => {
    // Simple mock seasonality
    const seasonalFactor = Math.sin((index / 11) * Math.PI);
    return {
      month,
      airTemp: Math.round(baseAir + (seasonalFactor * 15)),
      waterTemp: Math.round(baseWater + (seasonalFactor * 10))
    };
  });
};

const WEATHER_DATA: CountryWeather[] = [
  {
    id: "egypt",
    name: "Єгипет",
    flag: "🇪🇬",
    data: generateMockWeather(18, 20)
  },
  {
    id: "turkey",
    name: "Туреччина",
    flag: "🇹🇷",
    data: generateMockWeather(10, 15)
  },
  {
    id: "spain",
    name: "Іспанія",
    flag: "🇪🇸",
    data: generateMockWeather(12, 14)
  },
   {
    id: "greece",
    name: "Греція",
    flag: "🇬🇷",
    data: generateMockWeather(11, 15)
  },
  {
    id: "uae",
    name: "ОАЕ",
    flag: "🇦🇪",
    data: generateMockWeather(24, 22)
  },
];

export function WeatherWidget() {
  const [selectedCountry, setSelectedCountry] = useState<CountryWeather>(WEATHER_DATA[0]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm h-full flex flex-col">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
        <h2 className="text-2xl font-light text-white flex items-center gap-2">
          <CloudSun className="w-6 h-6 text-accent" />
          Погода по країнам
        </h2>

        <div className="flex flex-wrap gap-2 justify-start xl:justify-end">
          {WEATHER_DATA.map((country) => (
            <button
              key={country.id}
              onClick={() => setSelectedCountry(country)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all border",
                selectedCountry.id === country.id
                  ? "bg-accent text-white border-accent"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:border-white/20"
              )}
            >
              <span className="mr-1.5">{country.flag}</span>
              {country.name}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full">
            <div className="grid grid-cols-3 gap-4 mb-3 px-4 py-2 text-sm text-white/50 border-b border-white/5">
                <div>Місяць</div>
                <div className="flex items-center gap-1.5 justify-center">
                    <Thermometer className="w-4 h-4" /> Повітря
                </div>
                <div className="flex items-center gap-1.5 justify-center">
                    <Waves className="w-4 h-4" /> Вода
                </div>
            </div>

            <div className="space-y-2">
                {selectedCountry.data.map((item, index) => (
                    <div
                        key={item.month}
                        className="grid grid-cols-3 gap-4 px-4 py-3 rounded-lg bg-black/20 hover:bg-black/40 transition-colors border border-transparent hover:border-white/5 items-center"
                    >
                        <div className="font-medium text-white/90">{item.month}</div>
                        <div className="text-center font-bold text-yellow-400">
                            {item.airTemp > 0 ? "+" : ""}{item.airTemp}°C
                        </div>
                        <div className="text-center font-bold text-blue-400">
                            {item.waterTemp > 0 ? "+" : ""}{item.waterTemp}°C
                        </div>
                    </div>
                ))}
            </div>
      </div>
       <div className="mt-4 flex items-center gap-2 text-xs text-white/40 justify-end">
            <Info className="w-3 h-3" />
            Середні показники за останні 3 роки
       </div>
    </div>
  );
}
