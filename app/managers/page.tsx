"use client";

import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Phone, Send, User, MessageCircle, MessageSquareMore } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

// Day names mapping for display
const dayNames: Record<number, string> = {
  0: "Нд",
  1: "Пн",
  2: "Вт",
  3: "Ср",
  4: "Чт",
  5: "Пт",
  6: "Сб",
};

// Check if current time is within working hours (9:00-18:00 Kyiv time) for specific working days
const isWithinWorkingHours = (workingDays?: number[]) => {
  const now = new Date();
  const kyivTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Kyiv" }));
  const hours = kyivTime.getHours();
  const day = kyivTime.getDay();
  // Working hours: 9:00-20:00, on specified working days
  if (!workingDays) return false;
  return hours >= 9 && hours < 20 && workingDays.includes(day);
};

// Format working days for display
const formatWorkingDays = (workingDays?: number[]) => {
  if (!workingDays || workingDays.length === 0) return "";
  // Sort days starting from Monday (1) to Sunday (0 at end)
  const sortedDays = [...workingDays].sort((a, b) => {
    const orderA = a === 0 ? 7 : a;
    const orderB = b === 0 ? 7 : b;
    return orderA - orderB;
  });
  return sortedDays.map(d => dayNames[d]).join(", ") + ", 9:00-20:00";
};

const managers = [
  {
    name: "Олена Бриндак",
    role: "Керівник. Експерт.",
    phone: "+380677668584",
    telegram: "OlenaBryndak",
    description: "10 років присвячені тому, щоб турист отримував не просто тур, а бездоганний сервіс. Моя роль — бути гарантом вашого комфорту та головним ідеологом подорожей, які надихають. Я знаю, що розкіш полягає в деталях і відсутності турбот. Ваша задача лише одна – обрати напрямок. Про все інше потурбуюсь я.",
    isHuman: true,
    workingDays: [1, 2, 3, 4, 5, 6], // Пн, Вт, Ср, Чт, Пт, Сб
  },
  {
    name: "Ірина Смагач",
    role: "Турагент",
    phone: "+380673684260",
    telegram: "Iryna_Smagach",
    description: "Роки практики та тисячі вирішених завдань. Досвідчений агент — це ваша головна страховка від несподіванок. Чи то гаряче літо на узбережжі, чи засніжені гори взимку, підбере напрямок, який відгукнеться саме вам. Окрім пошуку туру можна придбати вигідні авіаквитки та страхування. Вам залишається тільки зібрати валізу.",
    isHuman: true,
    workingDays: [1, 2, 4, 5, 6], // Пн, Вт, Чт, Пт, Сб
  },
  {
    name: "Юлія Свідницька",
    role: "Турагент",
    phone: "+380671525500",
    telegram: "Julia_Svidnitska",
    description: "Знає особливості Таїланду і Занзибару та знайде ідеальне «all inclusive» у Домінікані. Допоможе зорієнтуватися у розкоші Еміратів та розкриє всі секрети відпочинку в Іспанії, яку знає та обожнює. Працює для того, щоб ви не просто побачили нову країну, а відчули її ритм, не відволікаючись на організаційні дрібниці.",
    isHuman: true,
    workingDays: [1, 2, 3, 4, 0], // Пн, Вт, Ср, Чт, Нд
  },
  {
    name: "Юлія Левадна",
    role: "Турагент",
    phone: "+380688828800",
    telegram: "Yuliia_Levadna",
    description: "Спеціалізується на популярних напрямках, тому проконсультує, який готель Єгипту справді оновив номери, а де в Туреччині найкраща анімація для дітей. Також допомагає закохатися в автобусні подорожі, зробивши ваш шлях за кордон легким та організованим. Дбає про ваші враження, як про власні!",
    isHuman: true,
    workingDays: [3, 4, 5, 6, 0], // Ср, Чт, Пт, Сб, Нд
  },
  {
    name: "ШІ Менеджер",
    role: "Віртуальний асистент",
    phone: "",
    telegram: "OlenaBryndak",
    description: "Не п'є, не їсть, тільки допомагає вам знайти ідеальний тур за лічені секунди!",
    isHuman: false,
    alwaysOnline: true,
  },
  {
    name: "Ви!",
    role: "Вакансія",
    phone: "+380677668584",
    telegram: "OlenaBryndak",
    description: "Амбіційний та молодий турагент, який віртуозно володіє сучасними трендами туризму та знає, що таке сервіс нового покоління. Це вакантне місце чекає на того, хто не просто продає тури, а створює стиль життя, сповнений яскравих вражень.",
    isHuman: false,
    isVacancy: true,
  },
];

export default function ManagersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<string | null>(null);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // Force re-render every minute to update online status
    const interval = setInterval(() => {
      forceUpdate({});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getOnlineStatus = (manager: typeof managers[0]) => {
    if ('alwaysOnline' in manager && manager.alwaysOnline) return true;
    if ('isVacancy' in manager && manager.isVacancy) return false;
    return manager.isHuman && 'workingDays' in manager && isWithinWorkingHours(manager.workingDays);
  };

  const handleConsultationClick = (managerName: string) => {
    setSelectedManager(managerName);
    setIsModalOpen(true);
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center px-4 py-24 relative overflow-hidden">

      <div className="w-full max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-6">
          <TextGenerateEffect
            words="Наша команда"
            className="text-4xl md:text-5xl lg:text-6xl font-light"
            accentWords={["команда"]}
            accentClassName="text-accent font-bold"
          />

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {managers.map((manager, index) => {
            const isOnline = getOnlineStatus(manager);
            return (
            <div key={index} className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md hover:border-accent/50 transition-all duration-300 flex flex-col gap-5 group hover:shadow-xl hover:shadow-accent/10">
              {/* Header with avatar and name */}
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300 shrink-0">
                  <User className="w-12 h-12" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold text-white truncate">{manager.name}</h3>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500/80'}`}/>
                  </div>
                  <p className="text-sm text-accent font-medium">{manager.role}</p>
                  <p className={`text-xs mt-0.5 ${isOnline ? 'text-green-500/80' : 'text-red-500/80'}`}>
                    {isOnline ? 'Доступний зараз' : manager.isHuman && 'workingDays' in manager ? formatWorkingDays(manager.workingDays) : 'Не в мережі'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-secondary/90 text-sm leading-relaxed grow">
                {manager.description}
              </p>

              {/* Primary CTA Button */}
              {!('isVacancy' in manager && manager.isVacancy) && (
              <button
                onClick={() => handleConsultationClick(manager.name)}
                className="w-full px-5 py-3.5 bg-accent hover:bg-accent/90 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group/btn font-medium shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:scale-[1.02]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Замовити консультацію</span>
              </button>
              )}

              {/* Contact Links - Secondary actions */}
              {manager.phone && manager.telegram && (
              <div className="pt-4 border-t border-white/10 flex items-center justify-center gap-6">
                <Link
                  href={`tel:${manager.phone}`}
                  className="flex items-center gap-2 text-secondary hover:text-accent transition-colors group/link"
                  title="Зателефонувати"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-xs font-medium">Телефон</span>
                </Link>
                <div className="w-px h-4 bg-white/10"/>
                <Link
                  href={`viber://chat?number=${manager.phone}`}
                  className="flex items-center gap-2 text-secondary hover:text-accent transition-colors group/link"
                  title="Call via Viber"
                >
                  <MessageSquareMore className="w-4 h-4" />
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
              )}
            </div>
          )})}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-black/80 border border-white/10 p-8 rounded-3xl backdrop-blur-md max-w-md w-full space-y-6 relative shadow-2xl">
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-light text-white">
                Замовити консультацію
              </h3>
              {selectedManager && (
                <p className="text-accent text-sm">
                  з {selectedManager}
                </p>
              )}
              <p className="text-secondary text-sm">
                Залиште свій номер і ми вам передзвонимо.
              </p>
            </div>

            <form className="space-y-4">
              <input
                type="tel"
                placeholder="Ваш номер телефону"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent transition-colors"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                >
                  Скасувати
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Implement manager approval
                    setIsModalOpen(false);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors font-medium"
                >
                  Підтвердити
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
