import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, Button } from "@mui/material";

const AlumniHome = () => {
    const [batches, setBatches] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const navigate = useNavigate();

    useEffect(() => {
        axios
            .post("http://localhost:8081/students/count-by-batch")
            .then(response => setBatches(response.data))
            .catch(error => console.error("Error fetching data:", error));
    }, []);

    const totalPages = Math.ceil(batches.length / itemsPerPage);
    const paginatedBatches = batches.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="py-16 max-w-7xl mx-auto px-4">
            <h1 className="text-2xl font-bold mb-4 text-white">Alumni Batches</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginatedBatches.map(batch => (
                    <Card key={batch.batchYear} className="shadow-md">
                        <CardContent className="flex flex-col p-3 h-full">
                            <h2 className="text-lg font-semibold mb-1">
                                Batch {batch.batchYear}
                            </h2>
                            <p className="text-sm text-gray-600">
                                Total Students: {batch.count}
                            </p>
                            {/* Spacer to push button to the bottom */}
                            <div className="mt-auto flex justify-end">
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => navigate(`/batch/${batch.batchYear}`)}
                                >
                                    View Details
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="flex justify-between items-center mt-4">
                <Button
                    variant="outlined"
                    size="small"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                >
                    Previous
                </Button>
                <span className="text-sm">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outlined"
                    size="small"
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
