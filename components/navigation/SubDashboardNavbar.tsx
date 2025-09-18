import Link from "next/link";
import { NavLink } from "./nav-link";

export default function SubDashboardNavbar() {
    return (
        <nav className="w-1/4 h-screen ">
            <div className="flex flex-col p-6">
                <ul className="flex flex-col space-y-4">
                    <li>
                        <NavLink href="/dashboard/my-packages" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                            Мої Турпакети
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/dashboard/settings" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                            Налаштування
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/dashboard/profile" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                            Профіль
                        </NavLink>
                    </li>
                </ul>
            </div>
        </nav>
    )
}