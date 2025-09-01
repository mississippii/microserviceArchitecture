const Header = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <header className="header">
      <h1>University Election System</h1>
      {localStorage.getItem('token') && (
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      )}
    </header>
  );
};

export default Header;