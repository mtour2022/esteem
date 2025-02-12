import logo from './logo.svg';
import './App.css';
import { Container } from 'react-bootstrap';

import { Navigate } from 'react-router-dom';

import { BrowserRouter as Router } from 'react-router-dom';
import { Route, Routes } from 'react-router-dom';
// Navigrations
import Home from './pages/Home';
import Company_Registration from './pages/Company_Registration';


function App() {
  return (
    <Container fluid >
      <Router> 
        <Routes>
              <Route path="/" element={<Home />}/>
              <Route path="/company_registration" element={<Company_Registration />}/>
        </Routes>
      </Router>
    </Container >
    // <div className="App">
    //   <header className="App-header">
    //     <img src={logo} className="App-logo" alt="logo" />
    //     <p>
    //       Edit <code>src/App.js</code> and save to reload.
    //     </p>
    //     <a
    //       className="App-link"
    //       href="https://reactjs.org"
    //       target="_blank"
    //       rel="noopener noreferrer"
    //     >
    //       Learn React
    //     </a>
    //   </header>
    // </div>
  );
}

export default App;
