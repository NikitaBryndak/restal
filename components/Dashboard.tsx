"use client"

import { Button } from "./ui/button";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

export default function Dashboard() {
    const { data: session } = useSession({
        required: true,
        onUnauthenticated() {
            window.location.href = '/login';
        },
    });

    return (
        <div className="flex justify-center items-center min-h-screen flex-col gap-3">
            <div className="rounded-md border p-5 w-full max-w-[380px] mx-4">
                <h1 className="text-2xl font-light mb-4">Dashboard</h1>
                <p className="text-sm text-foreground/60 mb-1">Name: {session?.user?.name}</p>
                <p className="text-sm text-foreground/60">Email: {session?.user?.email}</p>
                <Button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="mt-4 h-10 text-sm w-full"
                    variant="outline"
                >
                    Logout
                </Button>
            </div>
        </div>
    )
}