import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function NavLogo(data: {className?: string}) {
    let fullClassName = cn("flex items-center gap-3", data.className);
    return (
        <Link href="/" className={fullClassName}>
            <Image
                width={512}
                height={512}
                src="/logo.png"
                alt="RestAll Logo"
                className="w-10 h-10 object-contain"
            />
            <h1 className="text-3xl font-bold tracking-tight font-logo">
                RestAll
            </h1>
        </Link>
    )
}