import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, Button } from "@mui/material"; // Import from Material-UI

const AlumniHome = () => {
    const [batches, setBatches] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const navigate = useNavigate();

    useEffect(() => {
        axios.post("http://localhost:8081/students/count-by-batch") // Replace with your actual API endpoint
            .then(response => setBatches(response.data))
            .catch(error => console.error("Error fetching data:", error));
    }, []);

    const totalPages = Math.ceil(batches.length / itemsPerPage);
    const paginatedBatches = batches.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Alumni Batches</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedBatches.map(batch => (
                    <Card key={batch.batchYear} className="p-4 shadow-md">
                        <CardContent>
                            <h2 className="text-xl font-semibold">Batch {batch.batchYear}</h2>
                            <p className="text-gray-600">Total Students: {batch.count}</p>
                            <Button
                                className="mt-2"
                                onClick={() => navigate(`/batch/${batch.batchYear}`)}
                            >
                                View Details
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="flex justify-between mt-6">
                <Button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                >
                    Previous
                </Button>
                <span>Page {currentPage} of {totalPages}</span>
                <Button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

export default AlumniHome;
