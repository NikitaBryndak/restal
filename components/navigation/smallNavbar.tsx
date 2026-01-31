import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import React from "react";
import { NavLink } from "./nav-link";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function SmallNavbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const { data: session } = useSession();
    const { userProfile } = useUserProfile();

    function toggleMobileMenu() {
        setIsMobileMenuOpen((prev) => !prev);
    }

    return (
        <div className="sm:hidden flex items-center">
            <button onClick={toggleMobileMenu} className="z-50 text-white">
                {isMobileMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
            </button>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-black pt-24 flex flex-col h-screen text-white}">
                    <div className="flex-1 overflow-y-auto px-6 pb-4">
                        <div className="flex flex-col space-y-6">
                            {/* Main Navigation */}
                            <div className="flex flex-col space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b">
                                    Main
                                </h3>
                                <NavLink href="/tour-screener" onClick={toggleMobileMenu} className="text-lg font-medium">
                                    Selection
                                </NavLink>
                                <NavLink href="/info" onClick={toggleMobileMenu} className="text-lg font-medium">
                                    Info Center
                                </NavLink>
                                <NavLink href="/useful-info" onClick={toggleMobileMenu} className="text-lg font-medium">
                                    Useful Info
                                </NavLink>
                                <NavLink href="/contact" onClick={toggleMobileMenu} className="text-lg font-medium">
                                    Contact
                                </NavLink>
                                <NavLink href="/managers" onClick={toggleMobileMenu} className="text-lg font-medium">
                                    Managers
                                </NavLink>
                            </div>

                            {/* Dashboard Navigation - Only if logged in */}
                            {session && userProfile && (
                                <div className="flex flex-col space-y-4 pt-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b">
                                        Dashboard
                                    </h3>
                                    {userProfile.privilegeLevel > 1 && (
                                        <>
                                            <NavLink href="/dashboard/add-tour" onClick={toggleMobileMenu} className="text-lg">
                                                Add Tour
                                            </NavLink>
                                            <NavLink href="/dashboard/manage-tour" onClick={toggleMobileMenu} className="text-lg">
                                                Manage Tours
                                            </NavLink>
                                        </>
                                    )}
                                    <NavLink href="/dashboard/trips" onClick={toggleMobileMenu} className="text-lg">
                                        My Trips
                                    </NavLink>
                                    <NavLink href="/dashboard/settings" onClick={toggleMobileMenu} className="text-lg">
                                        Settings
                                    </NavLink>
                                    <NavLink href="/dashboard/profile" onClick={toggleMobileMenu} className="text-lg">
                                        Profile
                                    </NavLink>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Section */}
                    <div className="p-6 border-t bg-black">
                        <div className="flex flex-col space-y-4">
                            {session && userProfile && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Cashback</span>
                                    <NavLink href="/cashback" onClick={toggleMobileMenu} className="bg-accent p-1 rounded-md hover:text-black hover:bg-white">
                                        {(userProfile?.cashbackAmount ?? 0).toFixed(2)}₴
                                    </NavLink>
                                </div>
                            )}
                            <NavLink href="/login" variant="button" onClick={toggleMobileMenu} className="w-full flex justify-center">
                                {session ? "Account" : "Become a client"}
                            </NavLink>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
