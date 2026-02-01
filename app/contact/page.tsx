"use client";

import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormInput from "@/components/ui/form-input";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
   return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-16 sm:py-24 relative overflow-hidden">

         <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-24 items-center">
            {/* Left Column: Info */}
            <div className="space-y-6 sm:space-y-8">
               <div>
                  <TextGenerateEffect
                     words="Зв'яжіться з нами"
                     className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-4 sm:mb-6"
                     accentWords={["нами"]}
                     accentClassName="text-accent font-bold"
                  />
                  <p className="text-secondary text-base sm:text-lg mt-4 sm:mt-6 max-w-md leading-relaxed">
                     Маєте питання щодо вашої наступної подорожі? Ми тут, щоб допомогти вам спланувати ідеальну відпустку. Звертайтеся будь-коли.
                  </p>
               </div>

               <div className="space-y-6 sm:space-y-8 mt-6 sm:mt-8">
                  <div className="flex items-center gap-4 sm:gap-5 group">
                     <Link href="mailto:restal.inform@gmail.com" className="p-3 sm:p-4 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300 shrink-0">
                        <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                     </Link>
                     <div className="min-w-0">
                        <h3 className="font-medium text-base sm:text-lg">Електронна пошта</h3>
                        <p className="text-secondary text-sm sm:text-base break-all">restal.inform@gmail.com</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-5 group">
                     <Link href="viber://chat?number=+380687772550" className="p-3 sm:p-4 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300 shrink-0">
                        <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
                     </Link>
                     <div className="min-w-0">
                        <h3 className="font-medium text-base sm:text-lg">Телефон/Viber</h3>
                        <p className="text-secondary text-sm sm:text-base">+38 (068) 7772550</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-5 group">
                     <Link href="https://t.me/RestAL_travel" target="_blank" rel="noopener noreferrer" className="p-3 sm:p-4 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300 shrink-0">
                        <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                     </Link>
                     <div className="min-w-0">
                        <h3 className="font-medium text-base sm:text-lg">Telegram</h3>
                        <p className="text-secondary text-sm sm:text-base">@RestAL_travel</p>
                     </div>
                  </div>

                  <div className="pt-6 sm:pt-8 border-t border-white/10">
                     <h3 className="text-lg sm:text-xl font-light text-white mb-6 sm:mb-8">Партнери-Офіси</h3>
                     <div className="space-y-6 sm:space-y-8">
                        <div className="flex items-start sm:items-center gap-4 sm:gap-5 group">
                           <Link href="https://maps.app.goo.gl/Vf5dhgpD4z8Xec7y7" target="_blank" rel="noopener noreferrer" className="p-3 sm:p-4 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300 shrink-0">
                              <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                           </Link>
                           <div className="min-w-0">
                              <h3 className="font-medium text-lg sm:text-xl text-orange-500/80">JoinUp Турагенція</h3>
                              <p className="text-secondary text-sm sm:text-base break-words">ТЦ Монблан, пров. С.Бандери, 2/1а, Хмельницький</p>
                           </div>
                        </div>

                        <div className="flex items-start sm:items-center gap-4 sm:gap-5 group">
                           <Link href="https://maps.app.goo.gl/scqauCGqKePULwXTA" target="_blank" rel="noopener noreferrer" className="p-3 sm:p-4 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300 shrink-0">
                              <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                           </Link>
                           <div className="min-w-0">
                              <h3 className="font-medium text-lg sm:text-xl text-red-500/80">Anex Турагенція</h3>
                              <p className="text-secondary text-sm sm:text-base break-words">ТЦ Агора, вул. Ст.Шосе, 2/1А, Хмельницький</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Column: Form */}
            <div className="bg-white/5 p-6 sm:p-8 md:p-10 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
               <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-white/80">Ім'я</Label>
                        <Input
                           id="firstName"
                           placeholder="Іван"
                           className="bg-black/40 border-white/10 focus:border-accent/50 h-12"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-white/80">Прізвище</Label>
                        <Input
                           id="lastName"
                           placeholder="Петренко"
                           className="bg-black/40 border-white/10 focus:border-accent/50 h-12"
                        />
                     </div>
                  </div>

                  <FormInput
                     labelText="Телефон"
                     placeholder="+38 (XXX) XXX-XXXX"
                     // TODO: implement phone formatting
                     // formatType="phone"
                     containerClassName="space-y-2"
                     className="bg-black/40 border-white/10 focus:border-accent/50 h-12"
                  />

                  <div className="space-y-2">
                     <Label htmlFor="message" className="text-white/80">Повідомлення</Label>
                     <textarea
                        id="message"
                        className="flex min-h-[150px] w-full rounded-md border border-white/10 bg-black/40 px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-accent/50 resize-none"
                        placeholder="Розкажіть нам про ваші плани подорожі..."
                     />
                  </div>

                  <Button className="w-full bg-accent hover:bg-accent/90 text-white h-12 text-base font-medium rounded-xl mt-2">
                     Надіслати повідомлення
                     <Send className="w-4 h-4 ml-2" />
                  </Button>
               </form>
            </div>
         </div>
      </main>
   );
}
