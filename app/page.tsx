
import { Button } from "@/components/ui/button";    
import { Search, Send } from "lucide-react";
import SearchBar from "../components/SearchBar";
import Link from "next/link";
import { use } from "react";

export default function Home() {
  return (
    <>

      {/* Main Content */}
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4">
        <div className="" aria-hidden="true" />
        
        {/* Title */}
        <div className="relative z-10 w-full max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl tracking-tight mb-5 font-light">
            Знайдіть свою ідеальну подорож
          </h2>
          
          {/* Search Bar */}
          <div className="flex justify-center ">
            <div className="flex justify-center items-center w-full gap-2 p-2.5 rounded-lg bg-input-bg backdrop-blur-sm ">
              <SearchBar />
              <Button 
                variant="outline" 
                size="icon"
                className="size-10 text-foreground/50 hover:text-foreground transition-colors"
              >
                <Search className="w-4 h-4" />
              </Button>

              <Link 
                href="/contact"
                className="hidden p-2 bg-white/90 text-black rounded-md transition-colors sm:flex items-center justify-center gap-2 text-sm "
              >
                Зв'язатись
                <Send className="w-4 h-4 flex-shrink-0" />
              </Link>

            </div>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-white/50 my-3">
            Спробуйте запитати...
          </p>

          <div className="flex justify-center mt-6">
            <Link 
                href="/contact"
                className="sm:hidden w-32 p-2 bg-white/90 text-black rounded-md transition-colors flex items-center justify-center gap-2 text-sm"
              >
                Зв'язатись
                <Send className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
