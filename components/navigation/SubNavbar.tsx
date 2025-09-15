import Link from "next/link";

export default function SubNavbar() {
    return (
        <nav className="">
            <div className="flex align-center justify-center mx-auto px-4 py-2">
                <ul className="flex justify-between items-center w-[600px] space-x-4">
                    <li>
                        <Link href="/dashboard/my-packages" className="text-md text-accent/90 hover:text-gray-900">
                            Мої Турпакети
                        </Link>
                    </li>
                    <li>
                        <Link href="/dashboard/settings" className="text-md text-accent/90 hover:text-gray-900">
                            Налаштування
                        </Link>
                    </li>
                    <li>
                        <Link href="/dashboard/profile" className="text-md text-accent/90 hover:text-gray-900">
                            Профіль
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
    )
}