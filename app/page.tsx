import { Button } from "@/components/ui/button";    
import { Search } from "lucide-react";
import SearchBar from "../components/SearchBar";

export default function Home() {
  return (
    <>

      {/* Main Content */}
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4">
        <div className="" aria-hidden="true" />
        
        {/* Title */}
        <div className="relative z-10 w-full max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl sm:text-5xl tracking-tight mb-6">
            Знайдіть свою ідеальну подорож
          </h2>
          
          {/* Search Bar */}
          <div className="flex justify-center">
            <div className="flex justify-center items-center w-full gap-2 p-3 rounded-lg bg-input-bg backdrop-blur-sm">
              <SearchBar />
              <Button 
                variant="outline" 
                size="icon"
                className="size-10 text-foreground/50 hover:text-foreground transition-colors"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-foreground/50 mt-4">
            Натисніть Enter для пошуку або використовуйте фільтри для уточнення
          </p>
        </div>

      </main>
    </>
  );
}
