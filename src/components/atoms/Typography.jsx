import React from 'react';

export const H1 = ({ children, className = '' }) => (
  <h1 className={`h1 ${className}`}>{children}</h1>
);

export const H2 = ({ children, className = '' }) => (
  <h2 className={`h2 ${className}`}>{children}</h2>
);

export const BodyLarge = ({ children, className = '' }) => (
  <p className={`body-large ${className}`}>{children}</p>
);

export const BodySmall = ({ children, className = '' }) => (
  <p className={`body-small ${className}`}>{children}</p>
);

export const Caption = ({ children, className = '' }) => (
  <span className={`caption ${className}`}>{children}</span>
);
