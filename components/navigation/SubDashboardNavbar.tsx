import Link from "next/link";
import { NavLink } from "./nav-link";

export default function SubDashboardNavbar() {
    return (
        <nav className="w-1/6 h-screen ">
            <div className="flex flex-col p-6">
                <ul className="flex flex-col space-y-4">
                    <li>
                        <NavLink href="/dashboard/add-tour" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                            Add Tour
                        </NavLink>
                    </li>
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