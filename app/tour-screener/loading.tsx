import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton>
      <div className="w-full max-w-4xl px-4 space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    </PageSkeleton>
  );
}
