import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import CompactProfileCard from "../components/CompactProfileCard.jsx";
import { STUDENT_API } from "../apiConfig.js";

const BatchDetails = () => {
    const { batchYear } = useParams();
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState("All");

    useEffect(() => {
        axios
            .post(`${STUDENT_API}/find-batch`, {
                batch: batchYear,
            })
            .then((response) => {
                setStudents(response.data);
                setFilteredStudents(response.data);
                setLoading(false);
            })
            .catch((err) => {
                setError("Error fetching data.");
                setLoading(false);
            });
    }, [batchYear]);

    // Update filtered students when selectedDepartment or students change.
    useEffect(() => {
        if (selectedDepartment === "All") {
            setFilteredStudents(students);
        } else {
            setFilteredStudents(
                students.filter(
                    (student) =>
                        student.department &&
                        student.department.toLowerCase() === selectedDepartment.toLowerCase()
                )
            );
        }
    }, [selectedDepartment, students]);

    // Get unique departments from students list.
    const uniqueDepartments = [
        "All",
        ...new Set(students.map((student) => student.department).filter(Boolean)),
    ];

    if (loading) return <div className="page-shell py-14 text-white/80">Loading batch {batchYear}…</div>;
    if (error) return <div className="page-shell py-14 text-red-200">{error}</div>;

    return (
        <div className="page-shell py-14 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                <div>
                    <p className="heading-strong text-xs text-white/60">Batch {batchYear}</p>
                    <h1 className="heading-strong text-xl text-white">Students of {batchYear}</h1>
                    <p className="text-white/70 max-w-2xl">
                        Filter by department and open any card to see the full alumni profile.
                    </p>
                </div>
                <div className="glass-panel rounded-xl px-4 py-3 border border-white/10">
                    <p className="heading-strong text-[10px] text-white/60">Students</p>
                    <p className="text-2xl font-semibold">{filteredStudents.length}</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="glass-panel rounded-lg px-4 py-2 border border-white/10 shadow-lg shadow-black/20">
                    <span className="heading-strong text-sm text-white">Filter by department</span>
                </div>
                <div className="relative">
                    <select
                        id="department"
                        className="appearance-none px-4 py-2 pr-8 rounded-lg bg-[#0b1224] border border-white/15 text-white focus:outline-none focus:border-amber-300/60 shadow-inner shadow-black/30 w-auto"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                        {uniqueDepartments.map((dept, index) => (
                            <option key={index} value={dept} className="text-black bg-white">
                                {dept}
                            </option>
                        ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-white/60 text-xs">▼</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStudents.length === 0 ? (
                    <div className="col-span-full text-center text-white/70 glass-panel rounded-xl py-10">
                        No students match this filter yet.
                    </div>
                ) : (
                    filteredStudents.map(
                        (student, index) =>
                            student && (
                                <CompactProfileCard key={index} alumniData={student} />
                            )
                    )
                )}
            </div>
        </div>
    );
};

export default BatchDetails;
