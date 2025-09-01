import { useState, useEffect } from 'react';
import { getResults } from '../services/api';

const Results = () => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await getResults();
        setResults(response.data);
      } catch (error) {
        console.error('Failed to fetch results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (isLoading) {
    return <div className="results-container">Loading results...</div>;
  }

  return (
    <div className="results-container">
      <h2>Election Results</h2>
      {results.length === 0 ? (
        <p>No results available yet.</p>
      ) : (
        results.map(positionResult => (
          <div key={positionResult.position} className="position-results">
            <h3>{positionResult.position}</h3>
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Department</th>
                  <th>Votes</th>
                </tr>
              </thead>
              <tbody>
                {positionResult.candidates.map(candidate => (
                  <tr key={candidate.id}>
                    <td>{candidate.name}</td>
                    <td>{candidate.department}</td>
                    <td>{candidate.votes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default Results;