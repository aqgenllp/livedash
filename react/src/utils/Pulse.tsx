import { Box } from '@mui/material';
import type { Pulse_Status } from '../types/globalTypes';


  const STATUS_COLORS: Record<string, string> = {
  SUCCESS: '#2e7d32',
  WARNING: '#ed6c02',
  ERROR: '#d32f2f',
  STOPPED: '#c62828',
  ACTIVE: '#1976d2',
  INACTIVE: '#757575',
};

const ReaderIndicator = ({ status }: { status: Pulse_Status }) => {
  const color = STATUS_COLORS[status];
  return (
    <Box
      sx={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        bgcolor: color,
        boxShadow:`
          0 0 6px ${color},
          0 0 12px ${color},
          0 0 18px ${color}
        `,
        position: 'relative',
        right: 0,
        animation: 'pulse 1.5s infinite',
        '@keyframes pulse': {
          '0%': { opacity: 0.6 },
          '50%': { opacity: 1 },
          '100%': { opacity: 0.6 },
        },
      }}
    />
  );
};


const ScanStatusLamp = ({ status,}: { status: 'GREEN' | 'ORANGE' | 'RED'}) => {
  const colorMap = {
    GREEN: '#4caf50',
    ORANGE: '#ff9800',
    RED: '#f44336',
  };

  const color = colorMap[status];

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: color,

        boxShadow: `
          inset 0 0 4px rgba(255,255,255,0.6),
          0 0 8px ${color},
          0 0 16px ${color}
        `,

        animation: 'pulse 1.5s infinite',

        '@keyframes pulse': {
          '0%': { opacity: 0.3 },
          '50%': { opacity: 1 },
          '100%': { opacity: 0.3 },
        },
      }}
    />
  );
};

export {ReaderIndicator,ScanStatusLamp};
