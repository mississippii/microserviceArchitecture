import "react";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa"; // Using React Icons

function Footer() {
    return (
        <footer className="bg-transparent text-white py-16">
            <div className="max-w-7xl mx-auto px-6">
                {/* Main footer content */}
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="text-4xl font-semibold mb-8 md:mb-0 text-center md:text-left">
                        NHS Alumni
                    </div>
                    <div className="flex flex-col md:flex-row items-center md:space-x-10 space-y-4 md:space-y-0 text-center md:text-left">
                        <a href="#" className="text-lime-50 hover:text-blue-500 transition-colors duration-300">About Us</a>
                        <a href="#" className="text-lime-50 hover:text-blue-500 transition-colors duration-300">Contact</a>
                        <a href="#" className="text-lime-50 hover:text-blue-500 transition-colors duration-300">Privacy Policy</a>
                    </div>
                </div>

                {/* Social Media Links */}
                <div className="flex justify-center space-x-8 mt-8">
                    <a href="#" className="text-lime-50 hover:text-blue-500 transition-all duration-300 transform hover:scale-110">
                        <FaFacebook className="text-3xl" />
                    </a>
                    <a href="#" className="text-lime-50 hover:text-blue-500 transition-all duration-300 transform hover:scale-110">
                        <FaTwitter className="text-3xl" />
                    </a>
                    <a href="#" className="text-lime-50 hover:text-blue-500 transition-all duration-300 transform hover:scale-110">
                        <FaLinkedin className="text-3xl" />
                    </a>
                    <a href="#" className="text-lime-50 hover:text-blue-500 transition-all duration-300 transform hover:scale-110">
                        <FaInstagram className="text-3xl" />
                    </a>
                </div>

                {/* Footer Bottom */}
                <div className="text-center text-sm text-white mt-12">
                    <p>&copy; 2025 School Alumni. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
