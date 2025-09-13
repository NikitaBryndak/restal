import './Navbar.css';
import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="navbar">
            <Link href="/"><h1 className="navbar-title">RestAll</h1></Link>
            <ul>
                <li><Link href="/">Головна</Link></li>
                <li><Link href="/info">Інформація</Link></li>
                <li><Link href="/login">Увійти</Link></li>
            </ul>
        </nav>
    )
}