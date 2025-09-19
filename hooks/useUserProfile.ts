"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface UserProfile {
    userName: string;
    userEmail: string;
    createdAt: string;
    cashbackAmount: number;
}

export const useUserProfile = () => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { data: session } = useSession();

    const fetchUserProfile = async () => {
        if (!session?.user?.email) return;
        
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch("/api/profileFetch", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "email": session.user.email
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch user profile");
            }

            const data = await response.json();
            setUserProfile(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user?.email) {
            fetchUserProfile();
        } else if (session === null) {
            setLoading(false);
        }
    }, [session]);

    return {
        userProfile,
        loading,
        error,
        refetch: fetchUserProfile
    };
};
