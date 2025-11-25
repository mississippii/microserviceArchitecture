import { useState } from "react";
import { Link } from "react-router-dom";

function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLinkClick = () => {
        setIsMenuOpen(false);
    };

    return (
        <header className="sticky top-0 z-40 backdrop-blur border-b border-white/10 bg-[#0c1327]/80">
            <div className="page-shell py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <span className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-lg font-bold text-[#0c1327] shadow-lg shadow-amber-500/30">
                            A
                        </span>
                        <div>
                            <Link
                                to="/"
                            onClick={handleLinkClick}
                            className="text-xl font-semibold tracking-tight text-white hover:text-cyan-300"
                        >
                            NHS ALUMNI
                        </Link>
                            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                                Reconnect &amp; celebrate
                            </p>
                        </div>
                    </div>

                    <div className="md:hidden">
                        <button
                            onClick={toggleMenu}
                            className="text-white focus:outline-none"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                className="w-6 h-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>
                    </div>

                    <nav className="hidden md:flex md:items-center md:space-x-2">
                        <Link
                            to="/"
                            onClick={handleLinkClick}
                            className="px-3 py-2 rounded-full text-sm text-white/80 hover:text-white hover:bg-white/10 transition"
                        >
                            Home
                        </Link>
                        <Link
                            to="/alumni"
                            onClick={handleLinkClick}
                            className="px-3 py-2 rounded-full text-sm text-white/80 hover:text-white hover:bg-white/10 transition"
                        >
                            Directory
                        </Link>
                        <Link
                            to="/signin"
                            onClick={handleLinkClick}
                            className="ml-4 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-[#0b1224] shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition"
                        >
                            Sign in
                        </Link>
                    </nav>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden bg-[#0f172a] border-t border-white/10">
                    <nav className="flex flex-col space-y-2 p-4">
                        <Link
                            to="/"
                            onClick={handleLinkClick}
                            className="px-3 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition"
                        >
                            Home
                        </Link>
                        <Link
                            to="/alumni"
                            onClick={handleLinkClick}
                            className="px-3 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition"
                        >
                            Directory
                        </Link>
                        <Link
                            to="/signin"
                            onClick={handleLinkClick}
                            className="px-3 py-2 rounded-md text-center bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-[#0b1224] font-semibold shadow-lg shadow-amber-500/30 hover:shadow-xl transition"
                        >
                            Sign in
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}

export default Header;
