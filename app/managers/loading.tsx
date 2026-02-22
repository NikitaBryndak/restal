import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-black">
      {/* Hero */}
      <section className="relative pt-28 pb-14 sm:pt-24 max-sm:pt-20 overflow-hidden">
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48 mx-auto rounded-full" />
          <Skeleton className="h-12 w-full max-w-md mx-auto" />
          <Skeleton className="h-5 w-72 mx-auto" />
        </div>
      </section>

      {/* Manager cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </section>
    </main>
  );
}
