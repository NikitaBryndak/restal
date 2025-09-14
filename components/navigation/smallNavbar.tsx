import { Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import React from "react";


export default function SmallNavbar() {
    const { data: session } = useSession();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    function toggleMobileMenu() {
        setIsMobileMenuOpen((prev) => !prev);
    }


    return (
        <div className="sm:hidden flex items-center">
            <button onClick={toggleMobileMenu}>
                <Menu className="h-8 w-8"  />
            </button>
        </div>
    )
}   
