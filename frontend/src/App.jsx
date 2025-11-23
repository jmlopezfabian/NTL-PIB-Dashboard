import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import PIBDashboard from './components/PIBDashboard';
import Header from './components/Header';

function App() {
  const [currentPage, setCurrentPage] = useState('radianza');

  return (
    <div className="App">
      <Header currentPage={currentPage} onPageChange={setCurrentPage} />
      {currentPage === 'radianza' ? <Dashboard /> : <PIBDashboard />}
    </div>
  );
}

export default App;
