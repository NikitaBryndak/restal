"use client";

import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Phone, Send, User } from "lucide-react";

const managers = [
  {
    name: "Alice Johnson",
    role: "Senior Travel Consultant",
    phone: "+1 (555) 000-1111",
    telegram: "@alice_travels",
    description: "Senior Travel Consultant with 10 years of experience in European tours. Passionate about creating unforgettable memories.",
  },
  {
    name: "Bob Smith",
    role: "Adventure Specialist",
    phone: "+1 (555) 000-2222",
    telegram: "@bob_adventures",
    description: "Specialist in Asian destinations and adventure travel. He has visited over 50 countries and loves hiking.",
  },
  {
    name: "Charlie Brown",
    role: "Luxury Travel Expert",
    phone: "+1 (555) 000-3333",
    telegram: "@charlie_trips",
    description: "Expert in luxury cruises and family vacations. Dedicated to providing top-notch service and exclusive deals.",
  },
];

export default function ManagersPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center px-4 py-24 relative overflow-hidden">

       <div className="w-full max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-6">
             <TextGenerateEffect
                words="Meet Our Team"
                className="text-4xl md:text-5xl lg:text-6xl font-light"
                accentWords={["Team"]}
                accentClassName="text-accent font-bold"
             />
             <p className="text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
                Our dedicated managers are here to ensure your travel experience is seamless and extraordinary. Contact them directly for personalized assistance.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {managers.map((manager, index) => (
              <div key={index} className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md hover:border-accent/50 transition-colors duration-300 flex flex-col gap-6 group">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{manager.name}</h3>
                    <p className="text-sm text-accent">{manager.role}</p>
                  </div>
                </div>

                <p className="text-secondary leading-relaxed flex-grow">
                  {manager.description}
                </p>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3 text-secondary hover:text-white transition-colors">
                    <Phone className="w-4 h-4 text-accent" />
                    <span>{manager.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-secondary hover:text-white transition-colors">
                    <Send className="w-4 h-4 text-accent" />
                    <span>{manager.telegram}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
       </div>
    </main>
  );
}
