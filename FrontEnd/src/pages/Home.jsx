import toast, { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import axios from "axios";
import { Link } from "react-router-dom";
import { FaSearch, FaHandshake, FaCalendarAlt } from "react-icons/fa";
import ProfileCard from "../components/ProfileCard.jsx";
import { STUDENT_API } from "../apiConfig.js";

function Home() {
    const [username, setUsername] = useState("");
    const [alumniData, setAlumniData] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [, setLoading] = useState(false);
    const [greeting, setGreeting] = useState("");
    const [total, setTotal] = useState(null);
    const [batches, setBatches] = useState([]);
    const [batchesLoading, setBatchesLoading] = useState(true);

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
            const response = await axios.post(`${STUDENT_API}/find-by-id`, {
                studentId: username,
            });
            setAlumniData(response.data);
            setShowResult(true);
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
                const response = await axios.post(`${STUDENT_API}/count`);
                setTotal(response.data);
                setUsername('');
            } catch (err) {
                console.error(err);
            }
        };
        fetchTotalConnected();
    }, []);

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const resp = await axios.post(`${STUDENT_API}/count-by-batch`);
                setBatches(resp.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setBatchesLoading(false);
            }
        };
        fetchBatches();
    }, []);
    return (
        <div className="text-white">
            <Toaster />
            <section className="page-shell pt-14 pb-10">
                <div className="grid md:grid-cols-2 gap-10 items-center">
                    <div className="space-y-6">
                        <p className="heading-strong text-xs text-white/60">
                            {greeting} | NHS ALUMNI
                        </p>
                        <h1 className="heading-strong text-3xl md:text-4xl leading-tight text-white">
                            NHS ALUMNI
                        </h1>
                        <p className="muted max-w-xl">
                            Stay connected. Find classmates. Explore where your batchmates are today.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <div className="px-4 py-3 rounded-xl bg-white/10 border border-white/10">
                                <p className="heading-strong text-[10px] text-white/60">Total connected</p>
                                <p className="text-2xl font-semibold">{total !== null ? total : 'Loading…'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel rounded-lg p-3 md:p-4 inline-flex flex-col gap-3 max-w-sm ml-auto">
                        <div className="flex items-center gap-2">
                            <span className="h-8 w-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs">
                                <FaSearch />
                            </span>
                            <div className="space-y-0.5">
                                <p className="heading-strong text-[10px] text-white/60">Find a profile</p>
                                <h3 className="heading-strong text-sm text-white">Search by ID</h3>
                                <p className="text-[11px] text-white/60">
                                    Enter your student ID to load your card.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <input
                                type="text"
                                placeholder="e.g. 201403005"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="rounded-md bg-white/5 border border-white/15 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/30"
                            />
                            <button
                                onClick={fetchAlumniData}
                                className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-[#0b1224] font-semibold px-3 py-2 rounded-md shadow-md shadow-amber-500/30 hover:shadow-lg transition"
                            >
                                Search alumni
                            </button>
                        </div>
                        <p className="text-[11px] text-white/60">Tip: Use your student ID to locate your profile quickly.</p>
                        </div>
                </div>
            </section>

            {alumniData && showResult && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                    <div className="relative max-w-3xl w-full">
                        <button
                            onClick={() => setShowResult(false)}
                            className="absolute top-3 right-3 z-10 h-10 w-10 rounded-full bg-black/70 border border-white/15 text-white flex items-center justify-center text-2xl font-bold transition hover:bg-black/80"
                            aria-label="Close"
                        >
                            ×
                        </button>
                        <ProfileCard alumniData={alumniData} />
                    </div>
                </div>
            )}

            <section className="page-shell pb-14">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                    <div>
                        <p className="heading-strong text-xs text-white/60">Directory snapshot</p>
                        <h3 className="heading-strong text-lg text-white">Browse by batch</h3>
                        <p className="text-white/70">Jump into a class and see everyone from that year.</p>
                    </div>
                    <Link
                        to="/alumni"
                        className="px-4 py-2 rounded-full border border-white/20 text-sm text-white/80 hover:text-white hover:border-white/40 transition"
                    >
                        View full directory
                    </Link>
                </div>

                {batchesLoading ? (
                    <div className="text-white/70">Loading batches…</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {batches.slice(0, 8).map(batch => (
                            <Link
                                to={`/batch/${batch.batchYear}`}
                                key={batch.batchYear}
                                className="glass-panel rounded-xl p-4 border border-white/10 hover:-translate-y-1 transition flex flex-col gap-2"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                                        <FaCalendarAlt />
                                    </span>
                                    <div>
                                        <p className="heading-strong text-[11px] text-white/60">Batch</p>
                                        <h4 className="heading-strong text-sm text-white">Class of {batch.batchYear}</h4>
                                    </div>
                                </div>
                                <p className="text-sm text-white/70">{batch.count} students</p>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default Home;
