import logo from './logo.svg';
import './App.css';
import { Container } from 'react-bootstrap';

import { Navigate } from 'react-router-dom';

import { BrowserRouter as Router } from 'react-router-dom';
import { Route, Routes } from 'react-router-dom';
import NotFound from './pages/NotFound';

// Navigrations
import Home from './pages/Home.js';
import Company_Registration from './pages/Company_Registration.js';

import { useState, useContext } from 'react';
import { AuthProvider, useAuth} from './auth/authentication.js';


function PrivateRoute({ element, ...rest }) {
  const { userLoggedIn } = useAuth();

  return userLoggedIn ? (
    element
  ) : (
    <Navigate to="/*" replace={true} />
  );
}

function App() {
  return (
    < AuthProvider>
      <Router>  

        <Container fluid>
          <Routes>
            <Route path="/" element={<Home />}/>
            <Route path="/company-registration" element={<Company_Registration />}/>
            <Route path="*" element={<NotFound />}/>
          </Routes>
        </Container >
      </Router>
    </AuthProvider>
  );  
}

export default App;
