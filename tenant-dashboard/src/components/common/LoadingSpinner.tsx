'use client';

import { CircularProgress, Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 40 
}: LoadingSpinnerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Provide a stable fallback during hydration
  if (!mounted) {
    return (
      <div 
        suppressHydrationWarning
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: '16px',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div 
          className="loading-spinner"
          style={{
            width: size,
            height: size,
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%'
          }}
        />
        {message && (
          <div style={{ color: '#6b7280', fontSize: '14px' }}>
            {message}
          </div>
        )}
        <style dangerouslySetInnerHTML={{
          __html: `
            .loading-spinner {
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        }} />
      </div>
    );
  }

  return (
    <Box
      suppressHydrationWarning
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      gap={2}
      sx={{ 
        backgroundColor: 'background.default',
        // Prevent layout shift during hydration
        position: 'relative',
        zIndex: 1
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}