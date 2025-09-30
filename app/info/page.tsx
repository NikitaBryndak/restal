import { Button } from "@/components/ui/button";
export default function InfoPage() {
  return (
      <>
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
            <h1>GG</h1>
            <Button variant="">hello</Button>
            <button
              href="/3d-models"
              className="px-6 py-4 text-black transition duration-100 bg-white border-2 border-black hover:bg-black hover:text-white"
            >
              Browse Models
            </button>
            <button></button>
            <button></button>
            <button></button>
        </div>
      </>
  );
}