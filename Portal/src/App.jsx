import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/Login.jsx';
import VotePage from './components/Voting.jsx';

function App() {
  const student = JSON.parse(localStorage.getItem("student"));

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route 
        path="/vote" 
        element={student ? <VotePage /> : <Navigate to="/" />} 
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
