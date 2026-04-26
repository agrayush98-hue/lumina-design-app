import { useEffect, useState } from 'react';

export function useFirebaseConnection() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 Browser: ONLINE');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('🔴 Browser: OFFLINE');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    browserOnline: isOnline,
    firebaseConnected: isOnline
  };
}
