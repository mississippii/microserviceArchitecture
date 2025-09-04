import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStudent } from "../services/api.jsx";

export default function LoginPage() {
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const student = await fetchStudent(studentId);
      localStorage.setItem("student", JSON.stringify(student));
      navigate("/vote");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center mt-20">
      <h1 className="text-2xl font-bold mb-4">Online Voting System</h1>
      <input
        type="text"
        placeholder="Enter Student ID"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        className="border p-2 rounded w-64 mb-4"
      />
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Login
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
