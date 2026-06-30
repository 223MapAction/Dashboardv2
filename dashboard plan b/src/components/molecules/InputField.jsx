import React from 'react';

export const InputField = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange,
  className = '',
  ...props 
}) => {
  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <input 
        type={type}
        className="input-field"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  );
};

export const SearchBar = ({ 
  placeholder = 'Rechercher...', 
  value, 
  onChange,
  className = '' 
}) => {
  return (
    <div className={`search-bar ${className}`}>
      <span className="search-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <input 
        type="text"
        className="input-field"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default InputField;
