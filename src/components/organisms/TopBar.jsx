import React from 'react';
import { SearchBar } from '../molecules/InputField';
import Button from '../atoms/Button';

export const TopBar = ({ onMenuClick, searchValue, onSearchChange }) => {
  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <Button variant="icon" onClick={onMenuClick} className="lg-hidden">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 12h18M3 6h18M3 18h18" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </Button>
        <a href="#" className="logo">Map Action</a>
      </div>
      
      <div className="top-bar-right">
        <div style={{ width: '300px', display: 'none' }} className="lg-block">
          <SearchBar 
            placeholder="Rechercher..." 
            value={searchValue}
            onChange={onSearchChange}
          />
        </div>
        
        <Button variant="icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
        
        <Button variant="icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
          </svg>
        </Button>
      </div>
    </header>
  );
};

export default TopBar;
