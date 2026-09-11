import React from 'react';
import { UnifiedAuthCard } from './UnifiedAuthCard';

interface InstructorLoginPageProps {
  onNavigate: (path: string) => void;
}

export const InstructorLoginPage: React.FC<InstructorLoginPageProps> = ({ onNavigate }) => {
  return <UnifiedAuthCard initialRole="INSTRUCTOR" onNavigate={onNavigate} />;
};
