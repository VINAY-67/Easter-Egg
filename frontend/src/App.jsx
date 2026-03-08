import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Instructions from './pages/Instructions';
import Game from './pages/Game';
import Level2 from './pages/Level2';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/" />;
  if (user?.isLocked) return <Navigate to="/locked" />;
  return children;
};

// Simple locked out component
const LockedOut = () => (
  <div className="locked-container">
    <h1>Account Locked</h1>
    <p>You have exhausted all your trials.</p>
  </div>
);

function App() {
  const { token, user } = useAuth();

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={token && !user?.isLocked ? <Navigate to="/instructions" /> : <Login />} />
        <Route path="/instructions" element={<ProtectedRoute><Instructions /></ProtectedRoute>} />
        <Route path="/game" element={<ProtectedRoute><Game /></ProtectedRoute>} />
        <Route path="/level2" element={<ProtectedRoute><Level2 /></ProtectedRoute>} />
        <Route path="/locked" element={<LockedOut />} />
      </Routes>
    </div>
  );
}

export default App;
