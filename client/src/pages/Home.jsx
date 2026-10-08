import React from 'react';
import { useCivic } from '../context/CivicContext';
import { CitizenDashboard } from './CitizenDashboard';
import { GovDashboard } from './GovDashboard';

export const Home = () => {
  const { userRole, user } = useCivic();

  // Route dynamically: If user is Authority/Admin, render Gov Dashboard, otherwise Citizen Dashboard
  const isGov = userRole === 'admin' || userRole === 'authority' || user?.role === 'authority';

  return isGov ? <GovDashboard /> : <CitizenDashboard />;
};
