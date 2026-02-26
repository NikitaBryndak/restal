import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function NavLogo(data: {className?: string}) {
    let fullClassName = cn("flex items-center gap-3", data.className);
    return (
        <Link href="/" className={fullClassName}>
            <Image
                width={40}
                height={40}
                src="/logo.png"
                alt="RestAL Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                sizes="40px"
                priority
            />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-logo">
                RestAL
            </h1>
        </Link>
    )
}