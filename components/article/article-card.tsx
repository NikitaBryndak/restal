"use client";

import { ArrowRight, Calendar } from "lucide-react";

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
  const slug = data._id || data.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  return (
    <div className="group bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md overflow-hidden hover:border-accent/50 transition-all duration-300 flex flex-col cursor-pointer"
      onClick={() => window.location.href = `/info/${slug}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {data.images ? (
        <img
          src={data.images}
          alt={data.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-white/10 text-sm text-white/50">
          No image preview
        </div>
      )}

        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
          <span className="text-xs font-medium text-white">
            {data.tag}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow space-y-4">
        <div className="space-y-2 flex-grow">
          <h3 className="text-xl font-semibold text-white group-hover:text-accent transition-colors line-clamp-2">
            {data.title}
          </h3>
          <p className="text-secondary text-sm line-clamp-3 leading-relaxed">
            {data.description}
          </p>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-secondary">
            <Calendar className="w-4 h-4" />
            <span>Recently</span>
          </div>
          <div className="flex items-center gap-1 text-accent font-medium group-hover:translate-x-1 transition-transform">
            Read Article
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
