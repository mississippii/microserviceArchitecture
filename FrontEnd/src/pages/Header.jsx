import React, { useState } from "react";

function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLinkClick = () => {
        setIsMenuOpen(false); // Close the menu when a link is clicked
    };

    return (
        <header className="bg-white text-black shadow-md">
            <div className="max-w-7xl mx-auto px-4 py-5">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <div className="text-2xl font-semibold">
                        <a href="#home" className="hover:text-gray-200 transition-colors duration-300">
                            School Alumni
                        </a>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="block md:hidden">
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

                    {/* Navigation Links */}
                    <nav className={`flex space-x-6 ${isMenuOpen ? "flex-col md:flex-row absolute top-full left-0 right-0 bg-blue-600 md:bg-transparent md:relative md:flex" : "md:flex"} md:space-x-8 mt-4 md:mt-0`}>
                        <a href="#home" onClick={handleLinkClick} className="hover:text-gray-200 transition-colors duration-300">
                            Home
                        </a>
                        <a href="#about" onClick={handleLinkClick} className="hover:text-gray-200 transition-colors duration-300">
                            About
                        </a>
                        <a href="#events" onClick={handleLinkClick} className="hover:text-gray-200 transition-colors duration-300">
                            Events
                        </a>
                        <a href="#contact" onClick={handleLinkClick} className="hover:text-gray-200 transition-colors duration-300">
                            Contact
                        </a>
                    </nav>
                </div>
            </div>
        </header>
    );
}

export default Header;
