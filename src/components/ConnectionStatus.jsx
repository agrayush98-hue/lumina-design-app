import { useFirebaseConnection } from '../hooks/useFirebaseConnection';

export default function ConnectionStatus() {
  const { isOnline } = useFirebaseConnection();

  if (isOnline) {
    return null; // Don't show anything when connected
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      border: '1px solid rgba(218, 165, 32, 0.5)',
      borderRadius: '8px',
      padding: '12px 20px',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '14px',
      color: '#DAA520',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      zIndex: 9998,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
      animation: 'fadeIn 0.3s ease-in',
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#DAA520',
        animation: 'pulse 2s ease-in-out infinite',
      }} />
      <span>Reconnecting...</span>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
