import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import ProctorDashboard from './pages/ProctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import EnrollHackathon from './pages/EnrollHackathon';
import TeamDashboard from './pages/TeamDashboard';
import './index.css';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route path="/student/dashboard" element={
                <PrivateRoute role="student">
                  <StudentDashboard />
                </PrivateRoute>
              } />

              <Route path="/enroll/:hackathonId" element={
                <PrivateRoute role="student">
                  <EnrollHackathon />
                </PrivateRoute>
              } />

              <Route path="/team-matching/:hackathonId" element={
                <PrivateRoute role="student">
                  <TeamDashboard />
                </PrivateRoute>
              } />

              <Route path="/proctor/dashboard" element={
                <PrivateRoute role="proctor">
                  <ProctorDashboard />
                </PrivateRoute>
              } />

              <Route path="/admin/dashboard" element={
                <PrivateRoute role="admin">
                  <AdminDashboard />
                </PrivateRoute>
              } />
            </Routes>
          </main>
          <footer style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: 'var(--secondary)',
            color: 'white',
            marginTop: 'auto',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>
              &copy; {new Date().getFullYear()} Thiagarajar College of Engineering. CSBS Department Hackathon Portal.
            </p>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
