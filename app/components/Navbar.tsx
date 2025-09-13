import './Navbar.css';
import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="navbar">
            <Link href="/" className='flex items-center '>
                <img src="/logo.png" alt="RestAll Logo" className="w-10" />
                <h1 className="navbar-title hidden sm:block">RestAll</h1>
            </Link>
            <ul className="fw-bold text-lg space-x-6">
                <li><Link href="/">Головна</Link></li>
                <li><Link href="/info">Інформація</Link></li>
                <li><Link href="/login">Увійти</Link></li>
            </ul>
        </nav>
    )
}