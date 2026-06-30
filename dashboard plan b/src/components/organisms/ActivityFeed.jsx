import React from 'react';

export const ActivityFeed = ({ activities = [] }) => {
  return (
    <div className="activity-feed">
      {activities.map((activity, index) => (
        <div 
          key={index} 
          className={`activity-item ${activity.severity === 'low' ? 'severity-low' : 'severity-high'}`}
        >
          <div className="activity-icon">
            {activity.severity === 'low' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01l-3-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div className="activity-content">
            <div className="activity-title">{activity.title}</div>
            <div className="activity-meta">
              {activity.timestamp} • {activity.user}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;
