import React from 'react';
import './Header.css';

const Header = ({ currentPage, onPageChange }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>{currentPage === 'pib' ? 'Dashboard de PIB' : 'Dashboard de Radianza'}</h1>
            <p>
              {currentPage === 'pib' 
                ? 'Visualización de PIB para municipios de la CDMX, más datos de Monterrey y Oaxaca de Juárez'
                : 'Visualización de datos de radianza para municipios de la CDMX, más datos de Monterrey y Oaxaca de Juárez'
              }
            </p>
          </div>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => onPageChange('radianza')}
              className={`nav-button ${currentPage === 'radianza' ? 'active' : ''}`}
            >
              Radianza
            </button>
            <button
              onClick={() => onPageChange('pib')}
              className={`nav-button ${currentPage === 'pib' ? 'active' : ''}`}
            >
              PIB
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;

