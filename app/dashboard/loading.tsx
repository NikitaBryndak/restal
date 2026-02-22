import { PageSkeleton, CardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton>
      <div className="w-full max-w-[400px] px-4">
        <CardSkeleton />
      </div>
    </PageSkeleton>
  );
}
