"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, Loader2, MessageSquarePlus } from "lucide-react";
import type { TourStatus } from "@/types";

interface ReviewFormProps {
    tripNumber: string;
    status: TourStatus;
    isAuthenticated: boolean;
}

const REVIEWABLE_STATUSES: TourStatus[] = ["Completed", "Archived"];

export default function ReviewForm({ tripNumber, status, isAuthenticated }: ReviewFormProps) {
    const router = useRouter();
    const [rating, setRating] = useState(0);
    const [text, setText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    // Reviews are only collected after the trip has ended
    if (!REVIEWABLE_STATUSES.includes(status)) {
        return null;
    }

    if (done) {
        return (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                <p className="text-emerald-300 font-medium text-center">Дякуємо! Ваш відгук опубліковано. ⭐</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 text-center">
                <MessageSquarePlus className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <p className="text-white/70 mb-4">Були ви на цій подорожі? Поділіться враженнями.</p>
                <Link
                    href="/login"
                    className="inline-block px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
                >
                    Увійти, щоб залишити відгук
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0 || submitting) return;
        setSubmitting(true);
        setError("");
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tripNumber, rating, text }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || "Не вдалося зберегти відгук");
                return;
            }
            setDone(true);
            router.refresh();
        } catch {
            setError("Помилка мережі. Спробуйте ще раз.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-blue-400" />
                Залишити відгук
            </h2>

            {/* Star rating */}
            <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((value) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        aria-label={`Оцінка ${value}`}
                        className="p-1 transition-transform hover:scale-110"
                    >
                        <Star
                            className={`w-8 h-8 ${value <= rating ? "fill-amber-400 text-amber-400" : "text-white/30"}`}
                        />
                    </button>
                ))}
                {rating > 0 && (
                    <span className="ml-2 text-sm text-white/60">{rating}/5</span>
                )}
            </div>

            {/* Comment */}
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Розкажіть, як сподобалась подорож (необов'язково)"
                className="w-full rounded-lg bg-black/20 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/60 resize-none mb-2"
            />
            <p className="text-right text-xs text-white/30 mb-4">{text.length}/500</p>

            {error && (
                <p className="text-red-400 text-sm mb-3">{error}</p>
            )}

            <button
                type="submit"
                disabled={rating === 0 || submitting}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Зберігаємо..." : "Опублікувати відгук"}
            </button>
        </form>
    );
}
