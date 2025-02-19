import React, { useState } from 'react';
import ProfileCard from './ProfileCard'; // Adjust the path as needed
import img1 from '../assets/student.jpeg';

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
            {/* Compact Card */}
            <div className="bg-white rounded-lg shadow-md p-4 max-w-xs mx-auto">
                <div className="flex flex-col items-center">
                    <img
                        src={alumniData?.profilePic || img1}
                        alt={`${alumniData?.firstName} ${alumniData?.lastName}`}
                        className="w-24 h-24 rounded-full object-cover mb-4"
                    />
                    <h2 className="text-xl font-semibold">
                        {alumniData?.firstName} {alumniData?.lastName}
                    </h2>
                    <p className="text-gray-600">Student ID: {alumniData?.studentId}</p>
                    <button
                        onClick={handleViewProfile}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        View Profile
                    </button>
                </div>
            </div>

            {/* Popup Modal */}
            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
                        <button
                            onClick={handleClosePopup}
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-2xl"
                        >
                            &times;
                        </button>
                        {/* Render the detailed ProfileCard component in the popup */}
                        <ProfileCard alumniData={alumniData} />
                    </div>
                </div>
            )}
        </>
    );
};

export default CompactProfileCard;
