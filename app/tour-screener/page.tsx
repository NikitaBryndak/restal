"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormInput from "@/components/ui/form-input";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { X, Send, Loader2, CheckCircle2 } from "lucide-react";

export default function TourScreenerPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(800);

  // Booking modal state
  const [showBooking, setShowBooking] = useState(false);
  const [tourCode, setTourCode] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setFirstName("");
    setLastName("");
    setPhone("");
    setMessage("");
    setError(null);
    setSuccess(false);
  }, []);

  const closeModal = useCallback(() => {
    setShowBooking(false);
    resetForm();
  }, [resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Введіть номер телефону");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const tourInfo = tourCode ? `[Тур: ${tourCode}]` : "";
      const hotelInfo = hotelName ? `[Готель: ${hotelName}]` : "";
      const fullMessage =
        [tourInfo, hotelInfo, message].filter(Boolean).join(" ") || tourInfo;

      const res = await fetch("/api/contact-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "tour",
          firstName,
          lastName,
          phone,
          message: fullMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Помилка надсилання");
        return;
      }
      setSuccess(true);
      setTimeout(() => closeModal(), 3000);
    } catch {
      setError("Помилка з'єднання з сервером");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data) return;

      if (
        event.data.type === "otpusk-resize" &&
        typeof event.data.height === "number"
      ) {
        setIframeHeight(event.data.height);
      }

      if (event.data.type === "otpusk-order") {
        setTourCode(event.data.tourCode || "");
        setHotelName(event.data.hotelName || "");
        resetForm();
        setShowBooking(true);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [resetForm]);

  return (
    <main className="min-h-screen w-full pt-28 pb-12 px-4 sm:pt-24 max-sm:pt-20 max-sm:px-2 max-sm:pb-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="mb-8 sm:mb-10">
          <TextGenerateEffect
            words="Підбір туру"
            className="text-3xl sm:text-4xl md:text-5xl font-light"
            accentWords={["туру"]}
            accentClassName="text-accent font-bold"
          />
          <p className="text-secondary text-base sm:text-lg mt-3 max-w-2xl leading-relaxed">
            Знайдіть ідеальний тур для вашої відпустки. Оберіть країну, дати та параметри пошуку.
          </p>
        </div>
        <iframe
          ref={iframeRef}
          src="/otpusk-widget.html"
          title="Пошук турів"
          style={{
            width: "100%",
            height: `${Math.max(iframeHeight, 1200)}px`,
            border: "none",
            display: "block",
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          allow="clipboard-write"
          loading="eager"
        />
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="relative w-full max-w-lg bg-white/5 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl sm:text-2xl font-light text-white mb-2 text-center">
              Замовити тур
            </h3>

            {(tourCode || hotelName) && (
              <div className="text-center mb-6 space-y-1">
                {hotelName && (
                  <p className="text-accent font-medium">{hotelName}</p>
                )}
                {tourCode && (
                  <p className="text-white/60 text-sm">Код туру: {tourCode}</p>
                )}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bookFirstName" className="text-white/80">
                    Ім&apos;я
                  </Label>
                  <Input
                    id="bookFirstName"
                    placeholder="Іван"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-black/40 border-white/10 focus:border-accent/50 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bookLastName" className="text-white/80">
                    Прізвище
                  </Label>
                  <Input
                    id="bookLastName"
                    placeholder="Петренко"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-black/40 border-white/10 focus:border-accent/50 h-12"
                  />
                </div>
              </div>

              <FormInput
                labelText="Телефон"
                placeholder="+38 (XXX) XXX-XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                containerClassName="space-y-2"
                className="bg-black/40 border-white/10 focus:border-accent/50 h-12"
              />

              <div className="space-y-2">
                <Label htmlFor="bookMessage" className="text-white/80">
                  Побажання
                </Label>
                <textarea
                  id="bookMessage"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex min-h-[100px] w-full rounded-md border border-white/10 bg-black/40 px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-accent/50 resize-none"
                  placeholder="Категорія готелю, харчування, побажання..."
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              {success && (
                <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Заявку надіслано! Ми зв&apos;яжемося з вами найближчим
                    часом.
                  </span>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting || success}
                className="w-full bg-accent hover:bg-accent/90 text-white h-12 text-base font-medium rounded-xl mt-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Надсилання...
                  </>
                ) : (
                  <>
                    Замовити тур
                    <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
