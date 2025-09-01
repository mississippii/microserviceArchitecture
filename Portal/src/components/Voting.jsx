import React, { useState, useEffect } from 'react';
import { getCandidates, submitVote } from '../services/api';

const Voting = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await getCandidates();
        setCandidates(response.data);
      } catch (error) {
        setMessage('Failed to load candidates. Please try again.');
      }
    };

    fetchCandidates();
  }, []);

  const handleVoteChange = (position, candidateId) => {
    setSelectedCandidates({
      ...selectedCandidates,
      [position]: candidateId
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const votes = Object.keys(selectedCandidates).map(position => ({
        position,
        candidateId: selectedCandidates[position]
      }));

      await submitVote({ votes });
      setMessage('Your vote has been submitted successfully!');
      setSelectedCandidates({});
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to submit vote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group candidates by position
  const candidatesByPosition = candidates.reduce((acc, candidate) => {
    if (!acc[candidate.position]) {
      acc[candidate.position] = [];
    }
    acc[candidate.position].push(candidate);
    return acc;
  }, {});

  return (
    <div className="voting-container">
      <h2>Cast Your Vote</h2>
      <form onSubmit={handleSubmit} className="voting-form">
        {Object.keys(candidatesByPosition).map(position => (
          <div key={position} className="position-group">
            <h3>{position}</h3>
            <div className="candidates-list">
              {candidatesByPosition[position].map(candidate => (
                <div key={candidate.id} className="candidate-item">
                  <input
                    type="radio"
                    id={`${position}-${candidate.id}`}
                    name={position}
                    value={candidate.id}
                    checked={selectedCandidates[position] === candidate.id}
                    onChange={() => handleVoteChange(position, candidate.id)}
                    required
                  />
                  <label htmlFor={`${position}-${candidate.id}`}>
                    {candidate.name} ({candidate.department})
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Vote'}
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default Voting;