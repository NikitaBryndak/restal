import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-xl bg-white/6",
        className
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable skeleton patterns                                         */
/* ------------------------------------------------------------------ */

/** Full-page centered skeleton loader — used by route loading.tsx files */
function PageSkeleton({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-1 items-center justify-center min-h-[60vh]", className)}>
      {children ?? (
        <div className="w-full max-w-md space-y-4 px-6">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <div className="space-y-3 pt-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      )}
    </div>
  );
}

/** Card skeleton — matches the glass-morphism card pattern used across the app */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-4",
      className
    )}>
      <Skeleton className="h-5 w-2/5" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

/** Trip card skeleton — matches TripCard layout (image + details) */
function TripCardSkeleton() {
  return (
    <div className="w-full h-auto md:h-84 mb-6 rounded-xl overflow-hidden relative bg-white/5 border border-white/10">
      <div className="flex flex-col md:flex-row h-full">
        <Skeleton className="h-48 md:h-full md:w-1/3 rounded-none" />
        <div className="flex-1 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Article card skeleton — matches ArticleCard layout */
function ArticleCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/3 overflow-hidden flex flex-col">
      <Skeleton className="h-48 rounded-none" />
      <div className="p-5 space-y-3 flex-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Profile skeleton — matches the profile page hero layout */
function ProfileSkeleton() {
  return (
    <div className="min-h-screen relative">
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Hero card */}
          <div className="backdrop-blur-sm bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
              <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full" />
              <div className="flex-1 space-y-3 text-center sm:text-left w-full">
                <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
                <Skeleton className="h-7 w-48 mx-auto sm:mx-0" />
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Skeleton className="h-6 w-28 rounded-full" />
                  <Skeleton className="h-6 w-36 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-16" />
              </div>
            ))}
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Dashboard form skeleton — for add-tour, add-article, manage-tour pages */
function DashboardFormSkeleton() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-3 text-center">
          <Skeleton className="h-3 w-20 mx-auto" />
          <Skeleton className="h-9 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </header>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Settings skeleton — for settings page */
function SettingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-6 w-6 rounded-lg" />
        <Skeleton className="h-7 w-48" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Table / list skeleton — for contact-requests, manage-articles, promo-codes */
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-lg" />
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Analytics skeleton — stat cards + chart placeholders */
function AnalyticsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Auth form skeleton — matches login/register form layout */
function AuthFormSkeleton() {
  return (
    <div className="min-h-screen flex">
      <div className="w-full lg:w-[45%] flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[380px] space-y-6">
          <Skeleton className="h-7 w-28" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="h-px w-full bg-white/10" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>
      </div>
      <div className="hidden lg:block lg:w-[55%]">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
    </div>
  );
}

/** Home page skeleton */
function HomeSkeleton() {
  return (
    <main className="relative overflow-x-hidden bg-black z-10">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center gap-6 pt-20">
          <Skeleton className="h-8 w-64 rounded-full" />
          <Skeleton className="h-14 w-full max-w-lg" />
          <Skeleton className="h-5 w-80" />
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-14 w-48 rounded-full" />
            <Skeleton className="h-14 w-40 rounded-full" />
          </div>
        </div>
      </section>
    </main>
  );
}

/** Cashback skeleton — matches the redesigned cashback page layout */
function CashbackSkeleton() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-black">
      {/* Hero */}
      <section className="relative pt-28 pb-10 sm:pt-24 max-sm:pt-20">
        <div className="max-w-6xl mx-auto px-4 max-sm:px-3 space-y-5">
          <Skeleton className="h-9 w-48 rounded-full" />
          <Skeleton className="h-12 w-80 sm:w-[420px]" />
          <Skeleton className="h-5 w-72" />
          <div className="flex flex-wrap gap-3 pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-32 rounded-full" />
            ))}
          </div>
        </div>
      </section>

      {/* Balance card */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 max-sm:px-3">
          <div className="rounded-3xl border border-white/5 bg-white/3 p-8 md:p-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className={cn("h-10", i === 0 ? "w-40" : "w-28")} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tab bar */}
      <section className="py-4">
        <div className="max-w-6xl mx-auto px-4 max-sm:px-3">
          <div className="flex gap-1 p-1 rounded-2xl bg-white/3 border border-white/5 w-fit">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>
      </section>

      {/* Content cards */}
      <section className="py-8 pb-20">
        <div className="max-w-6xl mx-auto px-4 max-sm:px-3">
          <div className="grid md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-white/3 p-7 space-y-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-36" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export {
  Skeleton,
  PageSkeleton,
  CardSkeleton,
  TripCardSkeleton,
  ArticleCardSkeleton,
  ProfileSkeleton,
  DashboardFormSkeleton,
  SettingsSkeleton,
  TableSkeleton,
  AnalyticsSkeleton,
  AuthFormSkeleton,
  HomeSkeleton,
  CashbackSkeleton,
};
