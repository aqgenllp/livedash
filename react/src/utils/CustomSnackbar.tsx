import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import type { AlertColor } from '@mui/material';

type CustomSnackbarProps = {
  open: boolean;
  message: string;
  severity?: AlertColor; // 'success' | 'error' | 'warning' | 'info'
  duration?: number;
  onClose: () => void;
};

export default function CustomSnackbar({ open, message, severity = 'info', duration = 4000, onClose }: CustomSnackbarProps) {
  return (
    <Snackbar open={open} autoHideDuration={duration} onClose={onClose} anchorOrigin={{ vertical: 'top', horizontal: 'center'}}>
      <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: '100%', zIndex: 1, mt: 'var(--spacing)',border:'0px solid transparent' }}> {message} </Alert>
    </Snackbar>
  );
}
