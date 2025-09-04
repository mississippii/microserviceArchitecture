import { useEffect, useState } from "react";
import { fetchCandidates, submitVote } from "../services/api";

export default function VotePage() {
  const [candidates, setCandidates] = useState({});
  const [votes, setVotes] = useState({});
  const student = JSON.parse(localStorage.getItem("student"));

  useEffect(() => {
    fetchCandidates().then(data => {
      const grouped = data.reduce((acc, c) => {
        acc[c.position] = acc[c.position] || [];
        acc[c.position].push(c);
        return acc;
      }, {});
      setCandidates(grouped);
    });
  }, []);

  const handleVote = (position, candidateId) => {
    setVotes({ ...votes, [position]: candidateId });
  };

  const handleSubmit = async () => {
    try {
      await submitVote(student.id, votes);
      alert("Vote submitted successfully!");
      localStorage.removeItem("student");
      // optionally redirect to results page
    } catch (err) {
      alert(err.response?.data?.message || "Voting failed");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Welcome, {student.name}</h1>

      {Object.keys(candidates).map(position => (
        <div key={position} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{position}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {candidates[position].map(c => {
              const isSelected = votes[position] === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleVote(position, c.id)}
                  className={`border rounded-lg p-4 cursor-pointer transform transition-all duration-200
                    ${isSelected ? 'bg-blue-100 border-blue-500 scale-105' : 'hover:shadow-lg'}`}
                >
                  {c.symbol && (
                    <div className="text-2xl mb-2 text-center">{c.symbol}</div>
                  )}
                  {c.photoUrl && (
                    <img
                      src={c.photoUrl}
                      alt={c.name}
                      className="w-full h-40 object-cover rounded-md mb-3"
                    />
                  )}
                  <h3 className="text-lg font-bold">{c.name}</h3>
                  <p className="text-gray-600">{c.slogan}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="bg-green-500 text-white px-6 py-3 rounded-md mt-4 hover:bg-green-600 transition-colors"
      >
        Submit Vote
      </button>
    </div>
  );
}
