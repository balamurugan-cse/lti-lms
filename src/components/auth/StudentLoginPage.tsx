import React from 'react';
import { UnifiedAuthCard } from './UnifiedAuthCard';

interface StudentLoginPageProps {
  onNavigate: (path: string) => void;
}

export const StudentLoginPage: React.FC<StudentLoginPageProps> = ({ onNavigate }) => {
  return <UnifiedAuthCard initialRole="STUDENT" onNavigate={onNavigate} />;
};
