import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { CompanyThemeProvider } from '@/components/auth/CompanyThemeProvider';
import { AppProvider } from '@/state';

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Provider store={store}>
    <AuthProvider>
      <CompanyThemeProvider>
        <AppProvider>{children}</AppProvider>
      </CompanyThemeProvider>
    </AuthProvider>
  </Provider>
);
