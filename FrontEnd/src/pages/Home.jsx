import React, { useState, useEffect } from 'react';
import axios from "axios";
import ProfileCard from "../components/ProfileCard.jsx";

function Home() {
    const [username, setUsername] = useState("");
    const [alumniData, setAlumniData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [greeting, setGreeting] = useState("");

    // Function to determine the time of day and set the greeting message
    const getGreetingMessage = () => {
        const currentHour = new Date().getHours();
        if (currentHour < 12 && currentHour >6) {
            return "Good Morning";
        } else if (currentHour < 18 && currentHour > 12) {
            return "Good Afternoon";
        } else {
            return "Good Evening";
        }
    };

    // Set greeting when the component mounts
    useEffect(() => {
        const greetingMessage = getGreetingMessage();
        setGreeting(greetingMessage);
    }, []);

    const fetchAlumniData = async () => {
        if (!username) return;
        setLoading(true);
        setError("");
        try {
            // Send a POST request using Axios
            const response = await axios.post(
                "http://localhost:8081/students/find-by-id",
                { studentId: username } // Send the studentId in the body
            );
            if(response.status === 200) {
                setAlumniData(response.data); // Store data if successful
                setUsername('')
            }else{
                setError("Not Found !");
            }
        } catch (err) {
            setError("Failed to fetch alumni data!"); // Error handling
            setAlumniData(null); // Reset the alumni data in case of error
        } finally {
            setLoading(false);
            setError("");
        }
    };

    return (
        <div className="bg-white text-gray-900">
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Dynamic Welcome Section with a beautiful design */}
                    <div className="text-center mb-12 p-8 bg-gradient-to-r from-blue-400 to-purple-600 rounded-lg shadow-lg">
                        <h1 className="text-5xl font-extrabold text-white mb-4">
                            {greeting}...
                        </h1>
                        <p className="text-xl text-white opacity-80">
                            Find and reconnect with your fellow alumni members!
                        </p>
                    </div>

                    <h2 className="text-3xl font-bold text-center mb-8">Find yourself</h2>

                    {/* Form to Enter Username with modern design */}
                    <div className="text-center mb-8">
                        <input
                            type="text"
                            placeholder="Enter Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md mb-4 w-full max-w-xs mx-auto focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
                        />
                        <button
                            onClick={fetchAlumniData}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition-all focus:ring-1 focus:ring-black duration-300 ease-in-out transform hover:scale-105 text-lg"
                        >
                            Search
                        </button>
                    </div>

                    {alumniData && <ProfileCard alumniData={alumniData} />}
                </div>
            </section>
        </div>
    );
}

export default Home;
