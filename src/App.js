import './App.css';
import { Container } from 'react-bootstrap';
import { Navigate, BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Pages
import Home from './pages/Home.js';
import CompanyRegistrationPage from './pages/Company_Registration.js';
import EmployeeRegistrationForm from './pages/Employee_Registration.js';
import CompanyDashboardPage from './pages/Company_Dashboard.js';
import NotFound from './pages/NotFound.js';

// Auth
import { AuthProvider, useAuth } from './auth/authentication.js';

// Private Route
function PrivateRoute({ element }) {
  const { userLoggedIn } = useAuth();
  return userLoggedIn ? element : <Navigate to="/" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Container fluid>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/company-registration" element={<CompanyRegistrationPage />} />
            <Route path="/employee-registration" element={<EmployeeRegistrationForm />} />
            <Route path="/employee-registration/:residency" element={<EmployeeRegistrationForm />} />
            {/* /quickstatus/:employee_quickstatus_id */}
            {/* ✅ Protected Routes */}
            <Route path="/company-dashboard" element={<PrivateRoute element={<CompanyDashboardPage />} />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>
      </Router>
    </AuthProvider>
  );
}

export default App;
