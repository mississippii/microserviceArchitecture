import  { useState } from "react";
import { useNavigate } from "react-router-dom";

function SignIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        if (email === "user@example.com" && password === "password123") {
            navigate("/");
        } else {
            navigate("/signup");
        }
    };

    return (
        <div className="page-shell min-h-[calc(100vh-160px)] flex items-center justify-center py-14 text-white">
            <div className="glass-panel w-full max-w-lg rounded-2xl p-8 border border-white/10">
                <div className="mb-6 text-center space-y-2">
                    <p className="heading-strong text-xs text-white/60">Welcome back</p>
                    <h1 className="heading-strong text-xl text-white">Sign in</h1>
                    <p className="text-white/70">Access the alumni tools and update your profile.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm text-white/80">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/50 focus:outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/30"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm text-white/80">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/50 focus:outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/30"
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 text-white/70">
                            <input type="checkbox" className="h-4 w-4 text-amber-400 rounded border-white/20 bg-white/5" />
                            Remember me
                        </label>
                        <a href="#" className="text-cyan-200 hover:text-white">Forgot password?</a>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-[#0b1224] font-semibold py-3 rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl transition"
                    >
                        Sign in
                    </button>

                    <p className="text-center text-sm text-white/70">
                        Don’t have an account yet?{" "}
                        <a href="/signup" className="text-cyan-200 hover:text-white underline">
                            Sign up
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default SignIn;
