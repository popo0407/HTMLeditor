import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  isLoading: boolean;
  message: string;
  children: React.ReactNode;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  isLoading, 
  message, 
  children 
}) => {
  return (
    <div className="loading-spinner-container">
      {children}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <div className="loading-message">{message}</div>
          </div>
        </div>
      )}
    </div>
  );
};