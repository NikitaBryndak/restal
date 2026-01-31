"use client";

import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Phone, Send, User, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const managers = [
  {
    name: "Олена Бриндак",
    role: "Директор з туризму",
    phone: "+380677668584",
    telegram: "OlenaBryndak",
    description: "Senior Travel Consultant with 10 years of experience in European tours. Passionate about creating unforgettable memories.",
    isOnline: true,
  },
  {
    name: "Ірина Смагач",
    role: "Турагент",
    phone: "+1 (555) 000-2222",
    telegram: "@bob_adventures",
    description: "Specialist in Asian destinations and adventure travel. He has visited over 50 countries and loves hiking.",
    isOnline: false,
  },
  {
    name: "Юлія Свідницька",
    role: "Турагент",
    phone: "+1 (555) 000-3333",
    telegram: "@charlie_trips",
    description: "Expert in luxury cruises and family vacations. Dedicated to providing top-notch service and exclusive deals.",
    isOnline: true,
  },
  {
    name: "Юлія Левадна",
    role: "Турагент",
    phone: "+1 (555) 000-1111",
    telegram: "@alice_travels",
    description: "Senior Travel Consultant with 10 years of experience in European tours. Passionate about creating unforgettable memories.",
    isOnline: true,
  },
  {
    name: "ШІ Менеджер",
    role: "Турагент",
    phone: "+1 (555) 000-2222",
    telegram: "@bob_adventures",
    description: "Не п'є, не їсть, тільки допомагає вам знайти ідеальний тур за лічені секунди!",
    isOnline: true,
  },
  {
    name: "Ви!",
    role: "Вакансія",
    phone: "+1 (555) 000-3333",
    telegram: "@charlie_trips",
    description: "Expert in luxury cruises and family vacations. Dedicated to providing top-notch service and exclusive deals.",
    isOnline: false,
  },
];

export default function ManagersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<string | null>(null);

  const handleConsultationClick = (managerName: string) => {
    setSelectedManager(managerName);
    setIsModalOpen(true);
  };

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

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {managers.map((manager, index) => (
            <div key={index} className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md hover:border-accent/50 transition-all duration-300 flex flex-col gap-5 group hover:shadow-xl hover:shadow-accent/10">
              {/* Header with avatar and name */}
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300 shrink-0">
                  <User className="w-12 h-12" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold text-white truncate">{manager.name}</h3>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${manager.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500/80'}`}/>
                  </div>
                  <p className="text-sm text-accent font-medium">{manager.role}</p>
                  <p className={`text-xs mt-0.5 ${manager.isOnline ? 'text-green-500/80' : 'text-red-500/80'}`}>
                    {manager.isOnline ? 'Available now' : 'Offline'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-secondary/90 text-sm leading-relaxed grow">
                {manager.description}
              </p>

              {/* Primary CTA Button */}
              <button
                onClick={() => handleConsultationClick(manager.name)}
                className="w-full px-5 py-3.5 bg-accent hover:bg-accent/90 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group/btn font-medium shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:scale-[1.02]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Request Consultation</span>
              </button>

              {/* Contact Links - Secondary actions */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-center gap-6">
                <Link
                  href={`viber://chat?number=${manager.phone}`}
                  className="flex items-center gap-2 text-secondary hover:text-accent transition-colors group/link"
                  title="Call via Viber"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-xs font-medium">Viber</span>
                </Link>
                <div className="w-px h-4 bg-white/10"/>
                <Link
                  href={`https://t.me/${manager.telegram}`}
                  className="flex items-center gap-2 text-secondary hover:text-accent transition-colors group/link"
                  title="Message on Telegram"
                >
                  <Send className="w-4 h-4" />
                  <span className="text-xs font-medium">Telegram</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-black/80 border border-white/10 p-8 rounded-3xl backdrop-blur-md max-w-md w-full space-y-6 relative shadow-2xl">
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-light text-white">
                Request Consultation
              </h3>
              {selectedManager && (
                <p className="text-accent text-sm">
                  with {selectedManager}
                </p>
              )}
              <p className="text-secondary text-sm">
                Leave your number and we'll call you back.
              </p>
            </div>

            <form className="space-y-4">
              <input
                type="tel"
                placeholder="Your phone number"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent transition-colors"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Implement manager approval
                    setIsModalOpen(false);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors font-medium"
                >
                  Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
