import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  type = 'button',
  className = '',
  ...props 
}) => {
  const baseClass = 'btn';
  const variantClass = variant === 'primary' ? 'btn-primary' : 
                       variant === 'secondary' ? 'btn-secondary' : 
                       variant === 'icon' ? 'btn-icon' : '';
  
  return (
    <button 
      type={type}
      className={`${baseClass} ${variantClass} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
