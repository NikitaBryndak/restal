import Link from "next/link";
import Image from "next/image";

export default function NavLogo() {
    return (
        <Link href="/" className="flex items-center gap-3">
            <Image 
                width={512}
                height={512}
                src="/logo.png" 
                alt="RestAll Logo" 
                className="w-10 h-10 object-contain" 
            />
            <h1 className="text-3xl font-bold tracking-tight">
                RestAll
            </h1>
        </Link>
    )
}