import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton>
      <div className="w-full max-w-4xl px-4 space-y-6">
        <Skeleton className="h-12 w-full max-w-xl mx-auto rounded-xl" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
    </PageSkeleton>
  );
}
