import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaCalendarAlt, FaUserFriends } from "react-icons/fa";
import { STUDENT_API } from "../apiConfig.js";

const AlumniHome = () => {
    const [batches, setBatches] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const navigate = useNavigate();

    useEffect(() => {
        axios
            .post(`${STUDENT_API}/count-by-batch`)
            .then(response => setBatches(response.data))
            .catch(error => console.error("Error fetching data:", error));
    }, []);

    const totalPages = batches.length ? Math.ceil(batches.length / itemsPerPage) : 1;
    const paginatedBatches = batches.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="page-shell py-14 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
                <div className="space-y-2">
                    <p className="heading-strong text-xs text-white/60">Directory</p>
                    <h1 className="heading-strong text-xl text-white">Alumni batches</h1>
                    <p className="text-white/70 max-w-2xl">
                        Explore every graduating year. Select a batch to see the students and their current journeys.
                    </p>
                </div>
                <div className="glass-panel rounded-xl px-5 py-4 border border-white/10">
                    <p className="heading-strong text-[10px] text-white/60">Total batches</p>
                    <p className="text-2xl font-semibold">{batches.length || 'Loading…'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {paginatedBatches.length === 0 ? (
                    <div className="col-span-full text-white/70 text-center py-12 glass-panel rounded-xl">
                        No batch data yet. Check back soon.
                    </div>
                ) : (
                    paginatedBatches.map(batch => (
                        <div
                            key={batch.batchYear}
                            className="glass-panel rounded-xl p-5 h-full flex flex-col gap-3 border border-white/10 hover:-translate-y-1 transition"
                        >
                            <div className="flex items-center justify-between">
                                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <FaCalendarAlt />
                                </div>
                                <span className="text-xs px-3 py-1 rounded-full bg-amber-300/15 border border-amber-300/30 text-amber-900">
                                    Batch {batch.batchYear}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold">Class of {batch.batchYear}</h2>
                                <div className="flex items-center gap-2 text-sm text-white/70">
                                    <FaUserFriends className="text-cyan-300" />
                                    <span>{batch.count} students</span>
                                </div>
                            </div>
                            <div className="mt-auto flex justify-end">
                                <button
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-sm font-semibold text-[#0b1224] shadow-md shadow-amber-500/30 hover:shadow-lg transition"
                                    onClick={() => navigate(`/batch/${batch.batchYear}`)}
                                >
                                    View details
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-8">
                <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={`px-4 py-2 rounded-lg border border-white/15 ${currentPage === 1 ? 'text-white/40' : 'hover:bg-white/10'}`}
                >
                    Previous
                </button>
                <span className="text-sm text-white/70">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={`px-4 py-2 rounded-lg border border-white/15 ${currentPage === totalPages ? 'text-white/40' : 'hover:bg-white/10'}`}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default AlumniHome;
