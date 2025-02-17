import React, { useState } from 'react';
import axios from "axios";
import img1 from '../assets/student.jpeg';

function Home() {

    const [username, setUsername] = useState("");
    const [alumniData, setAlumniData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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
            setAlumniData(response.data); // Store data if successful
            setUsername('')
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
            <header className="py-10">
                <div className="max-w-7xl mx-auto text-center px-4">
                    <h1 className="text-4xl font-bold mb-4">Welcome to Our School Alumni</h1>
                    <p className="text-lg mb-6">Connecting alumni, sharing memories, and fostering growth.</p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg">
                        Join Us Now
                    </button>
                </div>
            </header>

            <section className="py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-8">Find yourself</h2>

                    {/* Form to Enter Username */}
                    <div className="text-center mb-8">
                        <input
                            type="text"
                            placeholder="Enter Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md mb-4 w-full max-w-xs mx-auto focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <button
                            onClick={fetchAlumniData}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                        >
                            Search
                        </button>
                    </div>



                    {/* Display Error or Loading State */}
                    {error && <p className="text-red-600 text-center mb-4">{error}</p>}
                    {loading && <p className="text-blue-600 text-center mb-4">Loading...</p>}

                    {/* If alumni data is fetched, show the card */}
                    {alumniData && (
                        <div className="mt-6 mb-6 bg-white p-6 rounded-lg shadow-md max-w-md mx-auto transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                            {/* Profile Picture */}
                            <div className="flex justify-center mb-4">
                                <img
                                    src={img1}
                                    alt={`${alumniData.firstName} ${alumniData.lastName}`}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                                />
                            </div>

                            {/* Name */}
                            <h3 className="text-3xl font-extrabold text-center mb-4 text-gray-900">{alumniData.firstName} {alumniData.lastName}</h3>

                            {/* Additional Information */}
                            <div className="space-y-2">
                                <p className="text-gray-700"><strong className="font-semibold">Email:</strong> {alumniData.email}</p>
                                <p className="text-gray-700"><strong className="font-semibold">Phone:</strong> {alumniData.phoneNumber}</p>
                                <p className="text-gray-700"><strong className="font-semibold">Batch Year:</strong> {alumniData.batchYear}</p>
                                <p className="text-gray-700"><strong className="font-semibold">Occupation:</strong> {alumniData.occupation}</p>
                                <p className="text-gray-700"><strong className="font-semibold">Organization:</strong> {alumniData.organizationName}</p>
                                <p className="text-gray-700"><strong className="font-semibold">Blood Group:</strong> {alumniData.bloodGroup}</p>
                                <p className="text-gray-700"><strong className="font-semibold">Address:</strong> {alumniData.address}</p>
                                <p className="text-gray-700"><strong className="font-semibold">Department:</strong> {alumniData.department}</p>
                            </div>
                        </div>
                    )}

                    {/* Responsive Grid for the Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-semibold mb-4">Alumni Network</h3>
                            <p className="text-gray-700">Join a strong network of alumni and stay connected with events and updates.</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-semibold mb-4">Educational Growth</h3>
                            <p className="text-gray-700">Opportunities for personal and professional development for all alumni.</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-semibold mb-4">Community Events</h3>
                            <p className="text-gray-700">Participate in events that bring alumni together and celebrate shared experiences.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;
