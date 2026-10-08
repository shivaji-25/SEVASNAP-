import React from 'react';
import { useCivic } from '../context/CivicContext';
import { CitizenDashboard } from './CitizenDashboard';
import { GovDashboard } from './GovDashboard';

export const Home = () => {
  const { userRole } = useCivic();

  // Route dynamically to either the Citizen Dashboard or Government Admin Dashboard
  return userRole === 'admin' ? <GovDashboard /> : <CitizenDashboard />;
};
