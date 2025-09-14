import { Button } from "@/components/ui/button";    
import { Search } from "lucide-react";
import SearchBar from "../components/SearchBar";
import { ContactButton } from "@/components/ContactButton";

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
          <div className="flex justify-center">
            <div className="flex justify-center items-center w-full gap-2 p-2.5 rounded-lg bg-input-bg backdrop-blur-sm">
              <SearchBar />
              <Button 
                variant="outline" 
                size="icon"
                className="size-10 text-foreground/50 hover:text-foreground transition-colors"
              >
                <Search className="w-4 h-4" />
              </Button>
              <ContactButton />
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-white/50 mt-3">
            Спробуйте запитати...
          </p>
        </div>
      </main>
    </>
  );
}
