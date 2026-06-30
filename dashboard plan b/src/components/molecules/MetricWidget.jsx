import React from 'react';

export const MetricWidget = ({ 
  title, 
  value, 
  delta, 
  deltaType = 'positive',
  className = '' 
}) => {
  return (
    <div className={`metric-widget ${className}`}>
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}</div>
      {delta && (
        <div className={`metric-delta ${deltaType}`}>
          <span>{deltaType === 'positive' ? '↑' : '↓'}</span>
          <span>{delta}</span>
        </div>
      )}
    </div>
  );
};

export default MetricWidget;
