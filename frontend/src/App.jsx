import { useNavigate, useLocation, Navigate, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Instructions from './pages/Instructions';
import Game from './pages/Game';
import Level2 from './pages/Level2';
import Slider from './pages/Slider';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { token, user, setIntendedPath } = useAuth();
  const location = useLocation();

  if (!token) {
    setIntendedPath(location.pathname);
    return <Navigate to="/" />;
  }
  if (user?.isLocked) return <Navigate to="/locked" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/" />;
  if (user?.role !== 'admin') return <Navigate to="/instructions" />;
  return children;
};

// Simple locked out component
const LockedOut = () => (
  <div className="locked-container">
    <h1>Eliminated!</h1>
    <p>You have exhausted all your 3 lives for this round and have been eliminated.</p>
  </div>
);

function App() {
  const { token, user } = useAuth();

  const getTargetRoute = () => {
    if (user?.Scores?.['Round-2'] > 0) return '/slider';
    if (user?.Scores?.['Round-1'] > 0 || user?.HasWon) return '/level2';
    return '/game';
  };

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={token && !user?.isLocked ? (user?.role === 'admin' ? <Navigate to="/dashboard" /> : <Navigate to="/instructions" />) : <Login />} />
        <Route path="/register" element={token ? (user?.role === 'admin' ? <Navigate to="/dashboard" /> : <Navigate to="/instructions" />) : <Register />} />
        <Route path="/admin" element={token && user?.role === 'admin' ? <Navigate to="/dashboard" /> : <AdminLogin />} />
        <Route path="/instructions" element={<ProtectedRoute><Instructions /></ProtectedRoute>} />

        <Route path="/game" element={<ProtectedRoute>{user?.Scores?.['Round-1'] > 0 || user?.HasWon ? <Navigate to="/level2" /> : <Game />}</ProtectedRoute>} />
        <Route path="/level2" element={<ProtectedRoute>{user?.Scores?.['Round-2'] > 0 ? <Navigate to="/instructions" /> : <Level2 />}</ProtectedRoute>} />
        <Route path="/slider" element={<ProtectedRoute>{user?.Scores?.['Round-3'] > 0 ? <Navigate to="/instructions" /> : <Slider />}</ProtectedRoute>} />

        <Route path="/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/locked" element={<LockedOut />} />
      </Routes>
    </div>
  );
}

export default App;
