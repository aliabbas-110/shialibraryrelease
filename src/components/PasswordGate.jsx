// components/PasswordGate.jsx
import { useState, useEffect } from 'react';

const PASSWORD = "110";
const STORAGE_KEY = "password_verified";

const PasswordGate = ({ children }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if password was already verified
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'true') {
      setIsVerified(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === PASSWORD) {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsVerified(true);
      setError('');
    } else {
      setError('Incorrect password');
      setInput('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsVerified(false);
    setInput('');
  };

  if (!isVerified) {
    return (
      <div style={styles.container}>
        <div style={styles.gate}>
          <h2>Enter Password</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={styles.input}
              placeholder="Enter password"
              autoFocus
            />
            <button type="submit" style={styles.button}>
              Submit
            </button>
          </form>
          {error && <p style={styles.error}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {/* Optional: Add a logout button */}
      <button 
        onClick={handleLogout}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '8px 16px',
          background: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        Logout
      </button>
    </>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5'
  },
  gate: {
    background: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    width: '200px',
    marginRight: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  error: {
    color: 'red',
    marginTop: '10px'
  }
};

export default PasswordGate;