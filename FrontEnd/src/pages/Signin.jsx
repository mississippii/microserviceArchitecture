import  { useState } from "react";
import { useNavigate } from "react-router-dom";

function SignIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        // Dummy authentication logic (replace with actual API request)
        if (email === "user@example.com" && password === "password123") {
            navigate("/");
        } else {
            navigate("/signup");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-160px)] bg-transparent">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 dark:bg-transparent">
                <h1 className="text-2xl font-bold text-center  dark:text-white mb-6">
                    Sign in to your account
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Input */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium  dark:text-white">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-transparent dark:text-lime-50"
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium  dark:text-white">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-transparent dark:text-lime-50"/>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center">
                            <input type="checkbox" className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Remember me</span>
                        </label>
                        <a href="#" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                            Forgot password?
                        </a>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                    >
                        Sign in
                    </button>

                    {/* Sign Up Link */}
                    <p className="text-center text-sm text-gray-600 dark:text-lime-50">
                        Don’t have an account yet?{" "}
                        <a href="/signup" className="text-blue-600 hover:underline dark:text-blue-700">
                            Sign up
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default SignIn;
