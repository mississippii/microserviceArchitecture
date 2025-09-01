import { useState, useEffect } from 'react';
import Login from './components/Login';
import Voting from './components/Voting';
import Results from './components/Results';
import Header from './components/Header';
import { verifyToken } from './services/api';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if URL has token parameter (from email link)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      verifyTokenAndLogin(token);
    } else {
      // Check if already logged in
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setIsAuthenticated(true);
        setCurrentView('voting');
      }
    }
  }, []);

  const verifyTokenAndLogin = async (token) => {
    try {
      const response = await verifyToken(token);
      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
      setCurrentView('voting');
      
      // Remove token from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      alert('Invalid or expired token. Please request a new voting link.');
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <Login />;
      case 'voting':
        return <Voting />;
      case 'results':
        return <Results />;
      default:
        return <Login />;
    }
  };

  return (
    <div className="App">
      <Header />
      <nav className="navigation">
        {isAuthenticated && (
          <>
            <button 
              onClick={() => setCurrentView('voting')} 
              className={currentView === 'voting' ? 'active' : ''}
            >
              Voting
            </button>
            <button 
              onClick={() => setCurrentView('results')} 
              className={currentView === 'results' ? 'active' : ''}
            >
              Results
            </button>
          </>
        )}
      </nav>
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;