import { useState } from 'react';
import { initiateVoting } from '../services/api';

const Login = () => {
  const [studentId, setStudentId] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await initiateVoting(studentId);
      setMessage('Voting link has been sent to your email. Please check your inbox.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>University Election System</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="studentId">Student ID:</label>
          <input
            type="text"
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
            placeholder="Enter your student ID"
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Request Voting Link'}
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default Login;