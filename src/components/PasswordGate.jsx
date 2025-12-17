import { useState } from 'react';

const PasswordGate = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Set your secret password here
  const correctPassword = '110'; // 🔐 CHANGE THIS

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === correctPassword) {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
      setPassword('');
    }
  };

  // If correct password is entered, show the protected content
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Show password form
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh',
      padding: '20px'
    }}>
      <form onSubmit={handleSubmit} style={{ textAlign: 'center' }}>
        <h2>Site Under Construction</h2>
        <p>Please enter the password to access the library.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          style={{ padding: '10px', fontSize: '16px', marginRight: '10px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', fontSize: '16px' }}>
          Enter
        </button>
      </form>
    </div>
  );
};

export default PasswordGate;