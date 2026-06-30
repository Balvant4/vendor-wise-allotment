'use client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import queryClient from '@/lib/query-client';
import { AuthProvider } from '@/features/authentication/components/AuthProvider';
import { FilterProvider } from '@/features/dashboard/components/FilterProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FilterProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a2235',
                color: '#f1f5f9',
                border: '1px solid #1f2d45',
                fontSize: '13px',
                borderRadius: '10px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#0a0e17' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#0a0e17' } },
              duration: 4000,
            }}
          />
        </FilterProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
