/**
 * Notification components for error and success messages
 */

import React from 'react';
import {
  Snackbar,
  Alert,
} from '@mui/material';

interface NotificationProps {
  message: string | null;
  onClose: () => void;
  severity: 'error' | 'success' | 'warning' | 'info';
  autoHideDuration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  message,
  onClose,
  severity,
  autoHideDuration = 6000,
}) => {
  return (
    <Snackbar 
      open={!!message} 
      autoHideDuration={autoHideDuration} 
      onClose={onClose}
    >
      <Alert onClose={onClose} severity={severity}>
        {message}
      </Alert>
    </Snackbar>
  );
};

interface ErrorNotificationProps {
  error: string | null;
  onClose: () => void;
  show?: boolean;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onClose,
  show = true,
}) => {
  return (
    <Notification 
      message={show ? error : null}
      onClose={onClose}
      severity="error"
    />
  );
};

interface SuccessNotificationProps {
  success: string | null;
  onClose: () => void;
}

export const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  success,
  onClose,
}) => {
  return (
    <Notification 
      message={success}
      onClose={onClose}
      severity="success"
    />
  );
};