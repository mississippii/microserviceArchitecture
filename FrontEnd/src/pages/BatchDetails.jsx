import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import CompactProfileCard from "../components/CompactProfileCard.jsx";

const BatchDetails = () => {
    const { batchYear } = useParams();
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState("All");

    useEffect(() => {
        axios
            .post(`http://localhost:8081/students/find-batch`, {
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

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="py-16 max-w-7xl mx-auto px-4">
            {/* Header with Filter on the Right */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-4 sm:mb-0">
                    Students of Batch {batchYear}
                </h1>
                <div className="flex items-center">
                    <label htmlFor="department" className="text-white mr-2">
                        Filter by Department:
                    </label>
                    <select
                        id="department"
                        className="p-2 rounded"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                        {uniqueDepartments.map((dept, index) => (
                            <option key={index} value={dept}>
                                {dept}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Display filtered students */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredStudents.map(
                    (student, index) =>
                        student && (
                            <CompactProfileCard key={index} alumniData={student} />
                        )
                )}
            </div>
        </div>
    );
};

export default BatchDetails;
