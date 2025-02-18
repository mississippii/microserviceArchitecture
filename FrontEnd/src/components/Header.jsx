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
        <header className="bg-transparent text-white">
            <div className="max-w-7xl mx-auto px-4 py-5">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <div className="text-2xl font-semibold">
                        <Link
                            to="/"
                            onClick={handleLinkClick}
                            className="hover:text-white transition-colors duration-300"
                        >
                            NHS Alumni
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
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

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex md:items-center md:space-x-8">
                        <Link
                            to="/"
                            onClick={handleLinkClick}
                            className="hover:text-green-500 transition-colors duration-300"
                        >
                            Home
                        </Link>
                        <Link
                            to="/alumni"
                            onClick={handleLinkClick}
                            className="hover:text-green-500 transition-colors duration-300"
                        >
                            Alumni
                        </Link>
                        <Link
                            to="/about"
                            onClick={handleLinkClick}
                            className="hover:text-green-500 transition-colors duration-300"
                        >
                            About
                        </Link>
                        <Link
                            to="/events"
                            onClick={handleLinkClick}
                            className="hover:text-green-500 transition-colors duration-300"
                        >
                            Events
                        </Link>
                        <Link
                            to="/contact"
                            onClick={handleLinkClick}
                            className="hover:text-green-500 transition-colors duration-300"
                        >
                            Contact
                        </Link>
                        {/* Single Signin Button */}
                        <Link
                            to="/signin"
                            onClick={handleLinkClick}
                            className="ml-4 px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition"
                        >
                            Sign in
                        </Link>
                    </nav>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white shadow-md">
                    <nav className="flex flex-col space-y-2 p-4">
                        <Link
                            to="/"
                            onClick={handleLinkClick}
                            className="hover:text-green-500 transition-colors duration-300"
                        >
                            Home
                        </Link>
                        <Link
                            to="/alumni"
                            onClick={handleLinkClick}
                            className="hover:text-green-500 transition-colors duration-300"
                        >
                            Alumni
                        </Link>
                        <Link
                            to="/about"
                            onClick={handleLinkClick}
                            className="hover:text-green-500 transition-colors duration-300"
                        >
                            About
                        </Link>
                        <Link
                            to="/events"
                            onClick={handleLinkClick}
                            className="hover:text-green-500 transition-colors duration-300"
                        >
                            Events
                        </Link>
                        <Link
                            to="/contact"
                            onClick={handleLinkClick}
                            className="hover:text-green-500 transition-colors duration-300"
                        >
                            Contact
                        </Link>
                        <Link
                            to="/signin"
                            onClick={handleLinkClick}
                            className="mt-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-md text-center hover:bg-blue-600 hover:text-white transition"
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
