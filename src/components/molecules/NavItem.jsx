import React from 'react';

export const NavItem = ({ 
  icon, 
  label, 
  active = false, 
  onClick,
  className = '' 
}) => {
  return (
    <a 
      href="#" 
      className={`nav-item ${active ? 'active' : ''} ${className}`}
      onClick={(e) => {
        e.preventDefault();
        onClick && onClick();
      }}
    >
      {icon && <span className="nav-icon">{icon}</span>}
      <span>{label}</span>
    </a>
  );
};

export default NavItem;
