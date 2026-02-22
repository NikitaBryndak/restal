"use client";

import { ArrowRight, Calendar, Tag } from "lucide-react";
import { useRouter } from "next/navigation";

type ArticleProps = {
  data: {
    title: string;
    description: string;
    images: string;
    tag: string;
    content?: string;
    _id?: string;
  };
};

export default function ArticleCard({ data }: ArticleProps) {
  const router = useRouter();
  const slug = data._id || data.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  return (
    <div
      className="group relative rounded-2xl border border-white/6 hover:border-accent/30 bg-white/3 hover:bg-white/5 overflow-hidden transition-all duration-300 flex flex-col cursor-pointer shadow-lg shadow-black/20 hover:shadow-accent/10"
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/info/${slug}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/info/${slug}`); } }}
    >
      {/* Top accent gradient line on hover */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {data.images ? (
          <img
            src={data.images}
            alt={data.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-accent/10 via-white/5 to-accent/5 text-sm text-white/30">
            Немає зображення
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

        {data.tag && (
          <div className="absolute top-3 left-3 z-5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-medium text-white/90">
              <Tag className="w-3 h-3 text-accent" />
              {data.tag}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col grow space-y-3">
        <div className="space-y-2 grow">
          <h3 className="text-lg font-semibold text-white group-hover:text-accent transition-colors duration-300 line-clamp-2 leading-snug">
            {data.title}
          </h3>
          <p className="text-white/40 text-sm line-clamp-3 leading-relaxed">
            {data.description}
          </p>
        </div>

        <div className="pt-3 border-t border-white/6 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-white/30">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs">Нещодавно</span>
          </div>
          <div className="flex items-center gap-1 text-accent text-xs font-medium group-hover:translate-x-1 transition-transform duration-300">
            Читати
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
