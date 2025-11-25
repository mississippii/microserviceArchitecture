import React, { useState } from 'react';
import ProfileCard from './ProfileCard';
import img1 from '../assets/student.jpeg';
import { IMAGE_BASE } from "../apiConfig.js";

const CompactProfileCard = ({ alumniData }) => {
    const [showPopup, setShowPopup] = useState(false);

    const handleViewProfile = () => {
        setShowPopup(true);
    };

    const handleClosePopup = () => {
        setShowPopup(false);
    };

    return (
        <>
            <div className="rounded-xl p-5 text-white flex flex-col gap-3 hover:-translate-y-1 transition transform duration-200 border border-white/10 bg-black/70 backdrop-blur">
                <div className="flex items-center gap-3">
                    {alumniData?.profilePic && String(alumniData.profilePic).trim().length > 0 ? (
                        <img
                            src={alumniData.profilePic.startsWith('http')
                                ? alumniData.profilePic.replace('192.168.0.134:8001', '192.168.0.134:8081')
                                : `${IMAGE_BASE}${alumniData.profilePic}`}
                            alt={`${alumniData?.firstName || ''} ${alumniData?.lastName || ''}`}
                            className="w-16 h-16 rounded-full object-cover border border-white/20 shadow-lg shadow-black/30"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full border border-white/20 shadow-lg shadow-black/30 bg-white/10 flex items-center justify-center text-lg font-semibold text-white">
                            {`${alumniData?.firstName?.charAt(0) || ''}${alumniData?.lastName?.charAt(0) || ''}`.trim() || '?'}
                        </div>
                    )}
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold leading-tight text-white">
                            {alumniData?.firstName} {alumniData?.lastName}
                        </h2>
                        <p className="text-sm text-white/65">{alumniData?.occupation || 'Alumni'}</p>
                    </div>
                </div>

                <div className="flex items-center flex-wrap gap-2 text-xs">
                    <span className="px-3 py-1 rounded-full bg-white/8 border border-white/12 text-white/85">
                        ID: {alumniData?.studentId || '—'}
                    </span>
                    {alumniData?.department && (
                        <span className="px-3 py-1 rounded-full bg-amber-300/20 border border-amber-200/40 text-amber-100">
                            {alumniData.department}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-end">
                    <button
                        onClick={handleViewProfile}
                        className="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-sm font-semibold text-[#0b1224] shadow-md shadow-amber-500/25 hover:shadow-lg hover:-translate-y-0.5 transition"
                    >
                        View
                    </button>
                </div>
            </div>

            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
                    <div className="relative max-w-3xl w-full">
                        <button
                            onClick={handleClosePopup}
                            className="absolute top-3 right-3 z-10 h-10 w-10 rounded-full bg-black/70 border border-white/15 text-white flex items-center justify-center text-2xl font-bold transition hover:bg-black/80"
                            aria-label="Close"
                        >
                            ×
                        </button>
                        <ProfileCard alumniData={alumniData} />
                    </div>
                </div>
            )}
        </>
    );
};

export default CompactProfileCard;
