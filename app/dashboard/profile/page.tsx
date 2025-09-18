"use client";

import { useUserProfile } from "@/hooks/useUserProfile";

export default function ProfilePage() {

    const { userProfile, loading, error } = useUserProfile();

    if (loading) {
        return <div>Loading profile...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <h1>User Profile</h1>
            <pre>{JSON.stringify(userProfile, null, 2)}</pre>
        </div>
    );
}
