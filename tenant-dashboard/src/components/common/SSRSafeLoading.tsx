'use client';

import { Box, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';

interface SSRSafeLoadingProps {
  message?: string;
}

export default function SSRSafeLoading({ message }: SSRSafeLoadingProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      suppressHydrationWarning
    >
      {isMounted && <CircularProgress />}
    </Box>
  );
}