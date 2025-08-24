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
import VerifierRegisterPage from './pages/Verifier_Registration.js';
import VerifierLoginPage from './pages/Verifier_Login.js';
import VerifierEmployeeListPage from './pages/Verifier_Employee_List.js';
import VerifierDashboard from './pages/Verifier_Dashboard.js';
import TourismCertView from './components/TourismCertView.js';
import EditEmployeeForm from './pages/EditEmployee.js';
import EmployeeQRScannerPage from './pages/ApplicationStatusCheck.js';
import TourismCertQRScannerPage from './pages/Tourism_Cert_Check.js';
import TourismCertSearchPage from './pages/Tourism_Cert_Search.js'
import EmployeeDashboardPage from './pages/Employee_Dashboard.js';
import GeneralTFSummaryPage from './pages/GeneralTFSummary.js';
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
            <Route path="/verifier-registration/0b5f8f06bafb3828f619f6f96fc6adb2" element={<VerifierRegisterPage />} />
            <Route path="/verifier-login/0b5f8f06bafb3828f619f6f96fc6adb2" element={<VerifierLoginPage />} />
            <Route path="/tourism-certificate/:tourism_cert_id" element={<TourismCertView />} />
            <Route path="/application-status-check" element={<EmployeeQRScannerPage />} />
            <Route path="/application-status-check/:registration_id" element={<EmployeeQRScannerPage />} />
            <Route path="/tourism-cert-check" element={<TourismCertQRScannerPage />} />
            <Route path="/find-my-cert" element={<TourismCertSearchPage />} />
            <Route path="/general-tourism-frontliners-summary" element={<GeneralTFSummaryPage />} />



            {/* /quickstatus/:employee_quickstatus_id */}
            {/* ✅ Protected Routes */}
            <Route path="/employee-dashboard" element={<PrivateRoute element={<EmployeeDashboardPage />} />} />
            <Route path="/company-dashboard" element={<PrivateRoute element={<CompanyDashboardPage />} />} />
            <Route path="/verifier-employee/0b5f8f06bafb3828f619f6f96fc6adb2" element={<PrivateRoute element={<VerifierEmployeeListPage />} />}/>
            <Route path="/verifier-dashboard/0b5f8f06bafb3828f619f6f96fc6adb2" element={<PrivateRoute element={<VerifierDashboard />} />}/>
            <Route path="/verifier-employee-edit/:employee_id/0b5f8f06bafb3828f619f6f96fc6adb2" element={<PrivateRoute element={<EditEmployeeForm />} />}/>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>
      </Router>
    </AuthProvider>
  );
}

export default App;
