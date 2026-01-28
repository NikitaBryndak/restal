"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, History, TrendingUp } from "lucide-react";

interface CurrencyRate {
  currency: string;
  code: string;
  buy: number;
  sell: number;
  trend: "up" | "down" | "stable";
}

const MOCK_RATES: CurrencyRate[] = [
  { currency: "USD", code: "$", buy: 38.50, sell: 39.10, trend: "up" },
  { currency: "EUR", code: "€", buy: 41.80, sell: 42.50, trend: "down" },
  { currency: "PLN", code: "zł", buy: 9.60, sell: 9.95, trend: "stable" },
];

const MOCK_ARCHIVE = [
  { date: "27.01", usd: 39.05, eur: 42.45, pln: 9.90 },
  { date: "26.01", usd: 39.00, eur: 42.40, pln: 9.88 },
  { date: "25.01", usd: 38.95, eur: 42.55, pln: 9.92 },
  { date: "24.01", usd: 38.90, eur: 42.60, pln: 9.95 },
  { date: "23.01", usd: 38.95, eur: 42.50, pln: 9.91 },
];

export function CurrencyWidget() {
  const [showArchive, setShowArchive] = useState(false);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-accent" />
          Курс Валют
        </h2>
        <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded-full">
          Сьогодні
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {MOCK_RATES.map((rate) => (
          <div
            key={rate.currency}
            className="bg-black/20 rounded-xl p-4 border border-white/5 relative overflow-hidden group hover:border-accent/50 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-2xl font-bold text-accent">{rate.currency}</span>
              <span className="text-lg opacity-50">{rate.code}</span>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs text-white/40 mb-1">Купівля</div>
                <div className="text-xl font-medium">{rate.buy.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/40 mb-1">Продаж</div>
                <div className="text-xl font-medium">{rate.sell.toFixed(2)}</div>
              </div>
            </div>

            {rate.trend === "up" && (
                <div className="absolute top-2 right-2 text-green-500 opacity-20 group-hover:opacity-100 transition-opacity">
                    <ArrowUp className="w-4 h-4" />
                </div>
            )}
             {rate.trend === "down" && (
                <div className="absolute top-2 right-2 text-red-500 opacity-20 group-hover:opacity-100 transition-opacity">
                    <ArrowDown className="w-4 h-4" />
                </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowArchive(!showArchive)}
        className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/70 flex items-center justify-center gap-2 transition-all"
      >
        <History className="w-4 h-4" />
        {showArchive ? "Сховати архів" : "Переглянути архів курсів"}
      </button>

      {showArchive && (
        <div className="mt-4 overflow-hidden rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-4 duration-300">
           <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-white/40 uppercase bg-white/5">
                <tr>
                  <th className="px-4 py-3">Дата</th>
                  <th className="px-4 py-3">USD</th>
                  <th className="px-4 py-3">EUR</th>
                  <th className="px-4 py-3">PLN</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ARCHIVE.map((row) => (
                  <tr key={row.date} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-white/80">{row.date}</td>
                    <td className="px-4 py-3">{row.usd.toFixed(2)}</td>
                    <td className="px-4 py-3">{row.eur.toFixed(2)}</td>
                    <td className="px-4 py-3">{row.pln.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
           </div>
        </div>
      )}
    </div>
  );
}
