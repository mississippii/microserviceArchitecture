import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MdEmail } from 'react-icons/md';
import { FaPhone, FaGraduationCap, FaUniversity, FaTint, FaMapMarkerAlt, FaFacebook, FaInstagram, FaLinkedin, FaYoutube, FaIdBadge, FaBriefcase } from 'react-icons/fa';
import img1 from '../assets/student.jpeg';
import { STUDENT_API, IMAGE_BASE } from "../apiConfig.js";

const DetailItem = ({ icon, label, value, light }) => (
    <div className="flex items-start gap-2 flex-wrap justify-start text-left w-full">
        <span className={light ? "text-cyan-600 mt-0.5" : "text-cyan-300 mt-0.5"}>{icon}</span>
        <span className={`text-sm font-semibold ${light ? "text-slate-800" : "text-white"}`}>
            {label}:
        </span>
        <span className={`text-sm ${light ? "text-slate-900" : "text-white"}`}>
            {value || '—'}
        </span>
    </div>
);

const SocialLink = ({ href, icon, label, light }) => (
    <a
        href={href || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className={`h-10 w-10 rounded-full border flex items-center justify-center hover:-translate-y-0.5 transition ${
            light
                ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                : "bg-white/10 border-white/15 text-white hover:bg-white/15"
        }`}
    >
        {icon}
        <span className="sr-only">{label}</span>
    </a>
);

const ProfileCard = ({ alumniData, variant = "dark" }) => {
    const isLight = variant === "light";
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(alumniData || {});
    const [errors, setErrors] = useState({});
    const [submitState, setSubmitState] = useState({ status: 'idle', message: '' });
    const [uploadState, setUploadState] = useState({ status: 'idle', message: '' });

    const containerClass = isLight
        ? "bg-white text-slate-900 rounded-2xl p-6 md:p-7 max-w-xl mx-auto shadow-xl border border-slate-200"
        : "glass-panel rounded-2xl p-6 md:p-7 text-white max-w-xl mx-auto";

    useEffect(() => {
        if (alumniData) {
            setFormData({
                ...alumniData,
                profilePic: alumniData.profilePic || alumniData.imageUrl || ''
            });
        }
    }, [alumniData]);

    const validate = (data) => {
        const nextErrors = {};
        if (!data?.studentId) nextErrors.studentId = 'Student ID is required';
        if (!data?.firstName) nextErrors.firstName = 'First name is required';
        if (!data?.lastName) nextErrors.lastName = 'Last name is required';
        if (!data?.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
            nextErrors.email = 'Valid email required';
        }
        if (data?.phoneNumber && !/^[0-9+\-\s]{7,15}$/.test(data.phoneNumber)) {
            nextErrors.phoneNumber = 'Phone should be 7-15 digits';
        }
        if (data?.batchYear && !/^[0-9]{4}$/.test(String(data.batchYear))) {
            nextErrors.batchYear = 'Batch year must be 4 digits';
        }
        const urlFields = ['facebook', 'instagram', 'linkedin', 'youtube'];
        urlFields.forEach(f => {
            if (data?.[f] && !/^https?:\/\//i.test(data[f])) {
                nextErrors[f] = 'Use a valid URL (https://...)';
            }
        });
        return nextErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setErrors(prev => ({ ...prev, profilePic: "Only image files are allowed" }));
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, profilePic: "Max size 3MB" }));
            return;
        }
        setErrors(prev => ({ ...prev, profilePic: undefined }));
        setUploadState({ status: 'uploading', message: 'Uploading...' });
        const data = new FormData();
        data.append("file", file);
        if (formData?.studentId) {
            data.append("studentId", formData.studentId);
        }
        try {
            const resp = await axios.post(`${STUDENT_API}/upload-photo`, data);
            setFormData(prev => ({ ...prev, profilePic: resp.data }));
            setUploadState({ status: 'done', message: 'Photo uploaded' });
        } catch (err) {
            console.error(err);
            setUploadState({ status: 'error', message: 'Upload failed' });
            setErrors(prev => ({ ...prev, profilePic: "Upload failed" }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validation = validate(formData);
        setErrors(validation);
        if (Object.keys(validation).length) return;
        try {
            setSubmitState({ status: 'saving', message: '' });
            await axios.post(`${STUDENT_API}/update-profile`, formData);
            setSubmitState({ status: 'saved', message: 'Profile saved to alumni submissions.' });
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            setSubmitState({ status: 'error', message: 'Unable to save right now. Try again later.' });
        }
    };

    const resolvePhotoSrc = () => {
        const pic = alumniData?.profilePic;
        if (!pic || !String(pic).trim().length) return null;
        if (pic.startsWith('http')) {
            return pic.replace('192.168.0.134:8001', '192.168.0.134:8081');
        }
        return `${IMAGE_BASE}${pic}`;
    };

    const photoSrc = resolvePhotoSrc();
    const initials = `${alumniData?.firstName?.charAt(0) || ''}${alumniData?.lastName?.charAt(0) || ''}`.trim() || '?';

    const cardContent = (
        <div className={containerClass}>
            <div className="flex flex-col gap-6 items-center text-left">
                <div className="relative pb-2 flex flex-col items-center self-center">
                    {photoSrc ? (
                        <div
                            className={`h-28 w-28 md:h-32 md:w-32 rounded-full overflow-hidden border ${
                                isLight ? "border-slate-200" : "border-white/15"
                            } shadow-xl ${isLight ? "shadow-slate-200" : "shadow-cyan-500/20"}`}
                        >
                            <img
                                src={photoSrc}
                                alt={`${alumniData?.firstName || ''} ${alumniData?.lastName || ''}`}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-28 w-28 md:h-32 md:w-32 rounded-full border border-white/15 shadow-xl shadow-cyan-500/20 bg-white/10 flex items-center justify-center text-2xl font-semibold text-white">
                            {initials}
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-4 w-full">
                    <div className="flex flex-col gap-3 items-center text-left w-full">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                                {alumniData?.firstName} {alumniData?.lastName}
                            </h1>
                            <p className={isLight ? "text-slate-500" : "text-white/70"}>
                                {alumniData?.occupation || 'Alumni'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 w-full place-items-start">
                        <DetailItem label="Student ID" value={alumniData?.studentId} icon={<FaIdBadge />} light={isLight} />
                        <DetailItem label="Department" value={alumniData?.department} icon={<FaUniversity />} light={isLight} />
                        <DetailItem label="Email" value={alumniData?.email} icon={<MdEmail />} light={isLight} />
                        <DetailItem label="Phone" value={alumniData?.phoneNumber} icon={<FaPhone />} light={isLight} />
                        <DetailItem label="Occupation" value={alumniData?.occupation} icon={<FaBriefcase />} light={isLight} />
                        <DetailItem label="Organization" value={alumniData?.organizationName} icon={<FaUniversity />} light={isLight} />
                        <DetailItem label="Blood Group" value={alumniData?.bloodGroup} icon={<FaTint />} light={isLight} />
                        <DetailItem label="Address" value={alumniData?.address} icon={<FaMapMarkerAlt />} light={isLight} />
                        <DetailItem label="Graduation" value={alumniData?.batchYear} icon={<FaGraduationCap />} light={isLight} />
                    </div>
                </div>
            </div>

            <div
                className={`mt-7 pt-5 flex flex-col gap-3 w-full ${
                    isLight ? "border-t border-slate-200" : "border-t border-white/10"
                }`}
            >
                <span className={isLight ? "text-slate-600 text-sm" : "text-white/70 text-sm"}>Connect</span>
                <div className="flex items-center gap-3 flex-wrap justify-between">
                    <div className="flex items-center gap-3">
                        <SocialLink href={alumniData?.facebook} icon={<FaFacebook />} label="Facebook" light={isLight} />
                        <SocialLink href={alumniData?.instagram} icon={<FaInstagram />} label="Instagram" light={isLight} />
                        <SocialLink href={alumniData?.linkedin} icon={<FaLinkedin />} label="LinkedIn" light={isLight} />
                        <SocialLink href={alumniData?.youtube} icon={<FaYoutube />} label="YouTube" light={isLight} />
                    </div>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-sm font-semibold text-[#0b1224] shadow-md shadow-amber-500/30 hover:shadow-lg transition"
                    >
                        Edit
                    </button>
                </div>
                {submitState.status === 'error' && (
                    <p className="text-sm text-red-400">{submitState.message}</p>
                )}
                {submitState.status === 'saved' && (
                    <p className="text-sm text-green-300">{submitState.message}</p>
                )}
            </div>
        </div>
    );

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="bg-[#0f1115] text-white w-full max-w-3xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div>
                        <p className="heading-strong text-xs text-white/60">Update details</p>
                        <h3 className="heading-strong text-lg text-white">NHS ALUMNI</h3>
                    </div>
                    <button
                        onClick={() => setIsEditing(false)}
                        className="text-white/70 hover:text-white text-xl font-bold"
                    >
                        ×
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                    <label className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">Student ID</span>
                        <input
                            name="studentId"
                            value={formData?.studentId || ''}
                            disabled
                            className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white disabled:opacity-60"
                        />
                        {errors.studentId && <span className="text-xs text-red-400">{errors.studentId}</span>}
                    </label>
                    <label className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">First name</span>
                        <input
                            name="firstName"
                            value={formData?.firstName || ''}
                            onChange={handleChange}
                            className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white"
                            required
                        />
                        {errors.firstName && <span className="text-xs text-red-400">{errors.firstName}</span>}
                    </label>
                    <label className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">Last name</span>
                        <input
                            name="lastName"
                            value={formData?.lastName || ''}
                            onChange={handleChange}
                            className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white"
                            required
                        />
                        {errors.lastName && <span className="text-xs text-red-400">{errors.lastName}</span>}
                    </label>
                    <label className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">Email</span>
                        <input
                            name="email"
                            type="email"
                            value={formData?.email || ''}
                            onChange={handleChange}
                            className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white"
                            required
                        />
                        {errors.email && <span className="text-xs text-red-400">{errors.email}</span>}
                    </label>
                    <label className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">Phone</span>
                        <input
                            name="phoneNumber"
                            value={formData?.phoneNumber || ''}
                            onChange={handleChange}
                            className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white"
                        />
                        {errors.phoneNumber && <span className="text-xs text-red-400">{errors.phoneNumber}</span>}
                    </label>
                    <label className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">Occupation</span>
                        <input
                            name="occupation"
                            value={formData?.occupation || ''}
                            onChange={handleChange}
                            className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white"
                        />
                    </label>
                    <label className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">Organization</span>
                        <input
                            name="organizationName"
                            value={formData?.organizationName || ''}
                            onChange={handleChange}
                            className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white"
                        />
                    </label>
                    <label className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">Department</span>
                        <input
                            name="department"
                            value={formData?.department || ''}
                            onChange={handleChange}
                            className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white"
                        />
                    </label>
                    <label className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">Batch year</span>
                        <input
                            name="batchYear"
                            value={formData?.batchYear || ''}
                            onChange={handleChange}
                            className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white"
                        />
                        {errors.batchYear && <span className="text-xs text-red-400">{errors.batchYear}</span>}
                    </label>
                    <label className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">Blood group</span>
                        <input
                            name="bloodGroup"
                            value={formData?.bloodGroup || ''}
                            onChange={handleChange}
                            className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white"
                        />
                    </label>
                    <label className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">Address</span>
                        <input
                            name="address"
                            value={formData?.address || ''}
                            onChange={handleChange}
                            className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white"
                        />
                    </label>
                    <label className="flex flex-col text-sm gap-2 md:col-span-2">
                        <span className="font-semibold">Profile photo</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white"
                        />
                        {formData?.profilePic && formData.profilePic.startsWith('http') && (
                            <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
                                <img
                                    src={formData.profilePic}
                                    alt="Preview"
                                    className="h-10 w-10 rounded-full object-cover border border-white/15"
                                />
                                <span>Preview</span>
                            </div>
                        )}
                        {uploadState.status === 'uploading' && <span className="text-xs text-white/60">{uploadState.message}</span>}
                        {uploadState.status === 'done' && <span className="text-xs text-green-300">{uploadState.message}</span>}
                        {uploadState.status === 'error' && <span className="text-xs text-red-400">{uploadState.message}</span>}
                        {errors.profilePic && <span className="text-xs text-red-400">{errors.profilePic}</span>}
                    </label>
                    <label className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">Facebook</span>
                        <input
                            name="facebook"
                            value={formData?.facebook || ''}
                            onChange={handleChange}
                            className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white"
                            placeholder="https://facebook.com/..."
                        />
                        {errors.facebook && <span className="text-xs text-red-400">{errors.facebook}</span>}
                    </label>
                    <label className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">Instagram</span>
                        <input
                            name="instagram"
                            value={formData?.instagram || ''}
                            onChange={handleChange}
                            className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white"
                            placeholder="https://instagram.com/..."
                        />
                        {errors.instagram && <span className="text-xs text-red-400">{errors.instagram}</span>}
                    </label>
                    <label className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">LinkedIn</span>
                        <input
                            name="linkedin"
                            value={formData?.linkedin || ''}
                            onChange={handleChange}
                            className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white"
                            placeholder="https://linkedin.com/in/..."
                        />
                        {errors.linkedin && <span className="text-xs text-red-400">{errors.linkedin}</span>}
                    </label>
                    <label className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">YouTube</span>
                        <input
                            name="youtube"
                            value={formData?.youtube || ''}
                            onChange={handleChange}
                            className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-white"
                            placeholder="https://youtube.com/..."
                        />
                        {errors.youtube && <span className="text-xs text-red-400">{errors.youtube}</span>}
                    </label>

                    <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitState.status === 'saving'}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-sm font-semibold text-[#0b1224] shadow-md shadow-amber-500/30 hover:shadow-lg transition disabled:opacity-60"
                        >
                            {submitState.status === 'saving' ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return isEditing ? modalContent : cardContent;
};

export default ProfileCard;
