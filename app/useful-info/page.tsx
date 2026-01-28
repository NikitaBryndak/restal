import Navbar from "@/components/navigation/Navbar";
import { CurrencyWidget } from "@/components/useful-info/currency-widget";
import { WeatherWidget } from "@/components/useful-info/weather-widget";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { titleTextFadeDuration } from "@/config";

export default function UsefulInfoPage() {
  return (
    <div className="min-h-screen bg-black text-white relative">
       {/* Background gradient/glow similar to home page */}
       <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-black to-black pointer-events-none" aria-hidden="true" />

      <Navbar />

      <main className="relative z-10 container mx-auto px-4 py-24 sm:py-32">

        <div className="max-w-4xl mx-auto mb-16 text-center">
             <TextGenerateEffect
                className="text-3xl sm:text-4xl md:text-5xl font-light mb-4"
                words="Корисна інформація"
                duration={titleTextFadeDuration}
                accentClassName="text-accent font-bold"
                accentWords={["інформація"]}
            />
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Актуальні курси валют та погода в популярних країнах для планування вашої ідеальної подорожі.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Currency Section */}
          <div className="w-full">
            <CurrencyWidget />
          </div>

          {/* Weather Section */}
          <div className="w-full h-full">
            <WeatherWidget />
          </div>
        </div>

      </main>
    </div>
  );
}
