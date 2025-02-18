import toast, { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import axios from "axios";
import ProfileCard from "../components/ProfileCard.jsx";

function Home() {
    const [username, setUsername] = useState("");
    const [alumniData, setAlumniData] = useState(null);
    const [, setLoading] = useState(false);
    const [greeting, setGreeting] = useState("");
    const [total, setTotal] = useState(null);

    const getGreetingMessage = () => {
        const currentHour = new Date().getHours();
        if (currentHour <= 12 && currentHour > 6) {
            return "Good Morning";
        } else if (currentHour < 18 && currentHour > 12) {
            return "Good Afternoon";
        } else {
            return "Good Evening";
        }
    };

    useEffect(() => {
        const greetingMessage = getGreetingMessage();
        setGreeting(greetingMessage);
    }, []);

    const notify = () => toast.error("Student not found :)");

    const fetchAlumniData = async () => {
        if (!username) return;
        setLoading(true);
        try {
            const response = await axios.post("http://localhost:8081/students/find-by-id", {
                studentId: username,
            });
            setAlumniData(response.data);
            setUsername('');  // Clear the input field after successful search
        } catch (error) {
            notify();
            console.log(error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        const fetchTotalConnected = async () => {
            try {
                const response = await axios.post("http://localhost:8081/students/count");
                setTotal(response.data);
                setUsername('');
            } catch (err) {
                console.error(err);
            }
        };
        fetchTotalConnected();
    }, []);
    return (
        <div className="bg-transparent text-white">
            <Toaster />
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12 p-8 bg-gradient-to-r  rounded-lg shadow-lg">
                        <h1 className="text-5xl font-extrabold text-white mb-4">
                            {greeting}...
                        </h1>
                        <p className="text-xl text-white opacity-80">
                            Find and reconnect with your fellow alumni members!
                        </p>
                    </div>
                    <h2 className="text-3xl font-bold text-center mb-8">Find yourself</h2>
                    <div className="text-center mb-8">
                        <input
                            type="text"
                            placeholder="Enter Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md mb-4 mr-4 w-full max-w-xs mx-auto focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
                        />
                        <button
                            onClick={fetchAlumniData}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition-all focus:ring-1 focus:ring-black duration-300 ease-in-out transform hover:scale-105 text-lg"
                        >
                            Search
                        </button>
                    </div>
                    {alumniData && <ProfileCard alumniData={alumniData} />}

                    <div className="mb-12">
                        <div className="p-6 bg-transparent rounded-md text-center">
                            <h3 className="text-xl font-semibold">Total Connected</h3>
                            <p className="mt-2 text-3xl text-blue-600">
                                {total !== null ? total : 'Loading...'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;
