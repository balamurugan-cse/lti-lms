import React from 'react';
import { UnifiedAuthCard } from './UnifiedAuthCard';

interface AdminLoginPageProps {
  onNavigate: (path: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  return <UnifiedAuthCard initialRole="ADMIN" onNavigate={onNavigate} />;
};
