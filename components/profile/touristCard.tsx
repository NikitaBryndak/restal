import { TouristInfo } from "@/types";
import { Button } from "../ui/button";
import { Edit3, Trash2, User } from "lucide-react";

export default function TouristCard({ tourist }: { tourist: TouristInfo }) {

    return (
        <div className="backdrop-blur-sm bg-white/15 border border-white/20 rounded-2xl p-6 hover:bg-white/20 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-md">
                    <User className="w-7 h-7 text-white" />
                </div>
                <div>
                    <p className="font-bold text-white text-lg">{tourist.name}</p>
                    <p className="text-blue-200 font-medium">{tourist.passportExpiryDate}</p>
                </div>
            </div>
            <div className="flex gap-3">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400 rounded-lg font-medium transition-colors duration-200 bg-white/5"
                >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-red-400/50 text-red-300 hover:bg-red-500/20 hover:border-red-400 rounded-lg font-medium transition-colors duration-200 bg-white/5"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}