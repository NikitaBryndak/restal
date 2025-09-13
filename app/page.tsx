import { ArrowDownToLine, Search} from "lucide-react";
import SearchBar from "./components/SearchBar";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";

export default function Home() {
  return (
    <>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
        <div className="z-10 flex flex-col items-center justify-center w-full px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient tracking-tight">
            RestAll
          </h1>
          
          <p className="text-lg md:text-xl text-foreground/80 mb-8 text-center max-w-md animate-fade-in animation-delay-500">
            Знайдіть свою ідеальну подорож
          </p>

          <div className="group flex items-center space-x-3 w-full max-w-md backdrop-blur-sm bg-background/50 p-2 rounded-xl shadow-lg border border-foreground/10 hover:border-foreground/20 transition-all duration-300 transform hover:scale-102">
            <SearchBar  />
            <Button 
              variant="outline" 
              size="icon" 
              className="size-10 hover:bg-blue-500 hover:text-white transition-all duration-300"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex gap-4 mt-12 w-full max-w-2xl px-4 animate-fade-in animation-delay-1000">
            <Card className="flex-1 p-4 hover:shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-sm bg-background/40 border-foreground/5 hover:bg-background/60">
              <h3 className="font-semibold mb-2">Популярні напрямки</h3>
              <p className="text-sm text-foreground/70">Досліджуйте найкращі місця</p>
            </Card>
            <Card className="flex-1 p-4 hover:shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-sm bg-background/40 border-foreground/5 hover:bg-background/60">
              <h3 className="font-semibold mb-2">Спеціальні пропозиції</h3>
              <p className="text-sm text-foreground/70">Знайдіть найкращі ціни</p>
            </Card>
          </div>
        </div>

        <div className=" absolute bottom-20 flex flex-col items-center text-sm text-secondary-foreground group cursor-pointer">
          <p className="mb-3 text-center font-medium tracking-wide group-hover:text-blue-500 transition-colors duration-200">
            Більше Готових подорожей
          </p>
          <ArrowDownToLine className="size-6 opacity-75 group-hover:text-blue-500 transition-colors duration-200" />
        </div>

      </div>
    </>
  );
}
