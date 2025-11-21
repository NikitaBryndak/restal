"use client";

import { NavLink } from "./nav-link";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSession } from "next-auth/react";

export default function SubDashboardNavbar() {
    const { data: session } = useSession();
    const { userProfile } = useUserProfile();


    return (
        <nav className="w-40 h-screen sticky top-20">
            <div className="flex flex-col p-6">
                <ul className="flex flex-col space-y-4">

                    { userProfile &&
                        (userProfile?.privelegeLevel > 1 && (
                            <li>
                                <NavLink href="/dashboard/add-tour" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                                    Add Tour
                                </NavLink>
                            </li>
                    ))}

                    {userProfile && userProfile.privelegeLevel > 1 && (
                        <li>
                            <NavLink href="/dashboard/manage-tour" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                                Manage Tours
                            </NavLink>
                        </li>
                    )}

                    <li>
                        <NavLink href="/dashboard/trips" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                            My Trips
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/dashboard/settings" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                            Settings
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/dashboard/profile" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                            Profile
                        </NavLink>
                    </li>
                </ul>
            </div>
        </nav>
    )
}