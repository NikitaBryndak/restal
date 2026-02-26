import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Title */}
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>

        {/* Contact channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10">
              <Skeleton className="h-10 w-10 rounded-full mb-3" />
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-5 w-40" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white/5 rounded-xl p-8 border border-white/10">
            <Skeleton className="h-7 w-48 mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
              <Skeleton className="h-10 w-full rounded-lg mt-4" />
            </div>
          </div>

          {/* Office list */}
          <div className="space-y-4">
            <Skeleton className="h-7 w-40 mb-4" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-5 border border-white/10">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
