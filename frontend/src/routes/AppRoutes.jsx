import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Route Guards
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

// Pages
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { AccountsPage } from '../pages/AccountsPage';
import { TransferPage } from '../pages/TransferPage';
import { DepositPage } from '../pages/DepositPage';
import { WithdrawPage } from '../pages/WithdrawPage';
import { TransactionsPage } from '../pages/TransactionsPage';
import { StatementsPage } from '../pages/StatementsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { SettingsPage } from '../pages/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages with Landing Navbar & Footer */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        
        {/* Guest Only Routes (Redirect to /dashboard if logged in) */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* Authenticated Protected Banking Dashboard Pages */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/deposit" element={<DepositPage />} />
          <Route path="/withdraw" element={<WithdrawPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/statements" element={<StatementsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
