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
        <div className="flex justify-center items-center min-h-screen flex-col gap-4 ">
            <div className="rounded-md border p-6 ">
                <h1>Dashboard</h1>
                <p>Name: {session?.user?.name}</p>
                <p>Email: {session?.user?.email}</p>
                <Button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="mt-4"
                    variant="outline"
                >
                    Logout
                </Button>
            </div>
        </div>
    )
}