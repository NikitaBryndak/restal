import { getTripCount } from "@/app/actions/get-trip-count";
import HomeContent from "@/components/home-content";

export default async function Home() {
  const tripCount = await getTripCount();

  return <HomeContent tripCount={tripCount} />;
}
