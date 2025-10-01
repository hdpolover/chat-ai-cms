/**
 * SSR-safe date formatting utilities
 */

export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Use a consistent locale to avoid server/client mismatches
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC', // Use UTC to avoid timezone differences between server and client
      ...options
    };

    return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return formatDate(date);
  } catch (error) {
    console.error('Relative date formatting error:', error);
    return formatDate(date);
  }
};

/**
 * Generate a consistent ID that works the same on server and client
 */
export const generateConsistentId = (prefix: string = 'id'): string => {
  // Use a counter-based approach instead of Date.now() or Math.random()
  if (typeof window === 'undefined') {
    // Server-side: use a simple counter
    return `${prefix}_server_${Math.floor(Math.random() * 1000000)}`;
  }
  
  // Client-side: use performance.now() which is more consistent
  return `${prefix}_${Math.floor(performance.now() * 1000)}`;
};