import Link from "next/link";
import { Send } from "lucide-react";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { titleTextFadeDuration } from "@/config";
import SearchSection from "@/components/search/search-section";
import { ToursSoldCounter } from "@/components/ui/tours-sold-counter";
import { getTripCount } from "@/app/actions/get-trip-count";

export default async function Home() {
  const tripCount = await getTripCount();

  return (
    <>
      {/* Main Content */}
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4">
        <div className="" aria-hidden="true" />

        {/* Title */}
        <div className="relative z-10 w-full max-w-3xl mx-auto text-center flex flex-col gap-12">

          <TextGenerateEffect
            className="text-4xl sm:text-5xl md:text-6xl tracking-tight font-light text-white
            [text-wrap:balance] leading-tight"
            words="Find your perfect journey"
            duration={titleTextFadeDuration}
            accentClassName="text-accent font-bold"
            accentWords={["perfect"]}
          />

          {/* Search Section */}
          <SearchSection />

          {/* Stats Counter */}
          <div className="pt-8">
            <ToursSoldCounter count={tripCount} />
          </div>

          <div className="flex justify-center">
            <Link
                href="/contact"
                className="hover:bg-accent hover:text-white hover:border-accent sm:hidden w-32 p-2 bg-white/90 text-black rounded-md transition-colors flex items-center justify-center gap-2 text-sm"
              >
                Contact
                <Send className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
