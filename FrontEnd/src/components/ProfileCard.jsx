import React from 'react';
import { MdEmail } from 'react-icons/md';
import { FaPhone, FaGraduationCap, FaUniversity, FaTint, FaMapMarkerAlt, FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';
import img1 from '../assets/student.jpeg';

const DetailItem = ({ icon, label, value }) => (
    <div className="flex items-center">
        {icon}
        <span className="font-bold text-black mr-2">{label}:</span>
        <span className="text-gray-900">{value}</span>
    </div>
);

const SocialLink = ({ href, icon, label, color }) => (
    <a href={href || "#"} target="_blank" rel="noopener noreferrer"
       className={`text-2xl mx-3 transition-all duration-200 ${color} hover:opacity-75`}>
        {icon}
        <span className="sr-only">{label}</span>
    </a>
);

const ProfileCard = ({ alumniData }) => (
    <div className="mt-4 mb-4 bg-white rounded-lg shadow-md overflow-hidden max-w-sm mx-auto transition-all duration-200 hover:shadow-lg">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-green-900 to-cyan-950 pt-6 px-6 pb-2 border-b border-gray-500">
            <div className="flex flex-col items-center">
                <img
                    src={img1}
                    alt={`${alumniData?.firstName} ${alumniData?.lastName}`}
                    className="w-32 h-32 rounded-full border-2 border-white shadow-md object-cover mb-3"
                />
                <h1 className="text-2xl font-semibold text-lime-50 mb-1">
                    {alumniData?.firstName} {alumniData?.lastName}
                </h1>
                <p className="text-white text-base">
                    {alumniData?.occupation}
                </p>
            </div>
        </div>
        <div className="px-6 py-4">
            <div className="space-y-3 text-gray-800">
                <DetailItem label="Email" value={alumniData?.email} icon={<MdEmail className="w-4 h-4 mr-2 text-purple-950" />} />
                <DetailItem label="Phone" value={alumniData?.phoneNumber} icon={<FaPhone className="w-4 h-4 mr-2 text-purple-950" />} />
                <DetailItem label="Batch Year" value={alumniData?.batchYear} icon={<FaGraduationCap className="w-4 h-4 mr-2 text-purple-950" />} />
                <DetailItem label="Department" value={alumniData?.department} icon={<FaUniversity className="w-4 h-4 mr-2 text-purple-950" />} />
                <DetailItem label="Blood Group" value={alumniData?.bloodGroup} icon={<FaTint className="w-4 h-4 mr-2 text-purple-950" />} />
                <DetailItem label="Address" value={alumniData?.address} icon={<FaMapMarkerAlt className="w-4 h-4 mr-2 text-purple-950" />} />
                <DetailItem label="Organization" value={alumniData?.organizationName} icon={<FaUniversity className="w-4 h-4 mr-2 text-purple-950" />}/>
            </div>
        </div>

        <div className="px-6 py-4 bg-white border-gray-300 flex justify-center">
            <SocialLink href={alumniData?.facebook} icon={<FaFacebook />} label="Facebook" color="text-blue-600" />
            <SocialLink href={alumniData?.instagram} icon={<FaInstagram />} label="Instagram" color="text-pink-600" />
            <SocialLink href={alumniData?.linkedin} icon={<FaLinkedin />} label="LinkedIn" color="text-blue-600" />
            <SocialLink href={alumniData?.youtube} icon={<FaYoutube />} label="Youtube" color="text-red-600" />
        </div>

    </div>
);

export default ProfileCard;
