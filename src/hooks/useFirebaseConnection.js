import { useEffect, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirebaseConnection() {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Monitor browser online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor Firebase connection by watching a special .info/connected path
    // Create a dummy listener to detect connection state
    const connectedRef = doc(db, '.info/connected');

    let unsubscribe;
    try {
      unsubscribe = onSnapshot(connectedRef,
        (snapshot) => {
          // If we can successfully get snapshots, we're connected
          setIsConnected(true);
        },
        (error) => {
          // If snapshot fails, we're disconnected
          setIsConnected(false);
        }
      );
    } catch (error) {
      // Firestore doesn't support .info/connected, fallback to browser status only
      console.warn('Firebase connection monitoring not available');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // User is considered connected if either browser OR Firebase shows online
  return {
    isOnline: isOnline && isConnected,
    browserOnline: isOnline,
    firebaseConnected: isConnected
  };
}
