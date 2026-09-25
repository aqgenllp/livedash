import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  components: {
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          border: '1px solid #cfd8dc',
          padding: '6px 10px',
          fontSize: '0.875rem',
        },
        head: {
          backgroundColor: '#f5f7fa',
          color: '#0d47a1',
          fontWeight: 600,
          borderBottom: '2px solid #90caf9',
          whiteSpace:'nowrap'
        },
      },
    },


    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': {
            borderBottom: '1px solid #cfd8dc',
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #dadada',
        },
      },
    },
    
  },
});
