import "react";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";

function Footer() {
    return (
        <footer className="border-t border-white/10 bg-[#0b1224]/70 backdrop-blur pt-12 pb-10 text-white">
            <div className="page-shell">
                <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
                    <div>
                        <div className="flex items-center space-x-3 mb-4">
                            <span className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-[#0b1224] font-semibold shadow-md shadow-amber-500/30">
                                A
                            </span>
                            <div>
                                <h3 className="text-lg font-semibold">NHS ALUMNI</h3>
                                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Since 2025</p>
                            </div>
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed max-w-md">
                            A living directory for our alumni community. Celebrate milestones, reconnect with classmates, and discover where NHS has taken everyone.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60 mb-3">Navigate</h4>
                        <ul className="space-y-2 text-sm text-white/80">
                            <li><a href="/" className="hover:text-white transition">Home</a></li>
                            <li><a href="/alumni" className="hover:text-white transition">Directory</a></li>
                            <li><a href="/signin" className="hover:text-white transition">Sign in</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60 mb-3">Stay connected</h4>
                        <div className="flex items-center space-x-4">
                            <a href="#" className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                                <FaFacebook />
                            </a>
                            <a href="#" className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                                <FaTwitter />
                            </a>
                            <a href="#" className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                                <FaLinkedin />
                            </a>
                            <a href="#" className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                                <FaInstagram />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-10 text-xs text-white/50 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <p>&copy; 2025 NHS Alumni Network.</p>
                    <p className="mt-2 sm:mt-0">Built to keep the campus connections alive.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
