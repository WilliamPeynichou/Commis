import { Toaster } from 'sonner';

export function BrutalToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#FFFEF7',
          border: '3px solid #1A1A1A',
          borderRadius: '12px',
          boxShadow: '4px 4px 0px 0px rgba(26, 26, 26, 1)',
          fontFamily: 'Space Grotesk, system-ui, sans-serif',
          fontWeight: 600,
          color: '#1A1A1A',
        },
      }}
    />
  );
}
