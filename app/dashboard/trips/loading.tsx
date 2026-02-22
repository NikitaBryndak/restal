import { TripCardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="px-3 sm:px-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <TripCardSkeleton key={i} />
      ))}
    </div>
  );
}
