"use client"

import  { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";


export const AuthProvider = ({ children }: { children: ReactNode }) => {
    return (
        <SessionProvider 
            basePath="/api/auth"
            refetchInterval={0}
            refetchOnWindowFocus={false}
        >
            {children}
        </SessionProvider>
    )
}