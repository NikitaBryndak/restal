import { Skeleton, ArticleCardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-black">
      {/* Hero placeholder */}
      <section className="relative pt-28 pb-14 sm:pt-24 max-sm:pt-20 overflow-hidden">
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48 mx-auto rounded-full" />
          <Skeleton className="h-12 w-full max-w-md mx-auto" />
          <Skeleton className="h-5 w-72 mx-auto" />
        </div>
      </section>

      {/* Category & Search */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 pb-16">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full shrink-0" />
          ))}
        </div>
        <Skeleton className="h-12 w-full max-w-md rounded-xl" />

        {/* Article grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </main>
  );
}
