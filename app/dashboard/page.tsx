"use client"

import { useSession } from "next-auth/react";

export default function DashboardPage() {
    const { data: session } = useSession({
        required: true,
        onUnauthenticated() {
            window.location.href = '/login';
        },
    });

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-5rem)] flex-col gap-3 p-4">
            <div className="rounded-md border border-white/10 p-6 w-full max-w-[400px] bg-white/5 backdrop-blur-sm">
                <h1 className="text-2xl font-light mb-4">Dashboard</h1>
                <p className="text-sm text-foreground/60 mb-1">Name: {session?.user?.name}</p>
                <p className="text-sm text-foreground/60">Phone: {session?.user?.phoneNumber}</p>
            </div>
        </div>
    )
}