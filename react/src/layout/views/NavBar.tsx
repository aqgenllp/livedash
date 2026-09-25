import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { Menu, MenuItem } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { useApi } from '../../utils/GlobalApiWrapper';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/Authcontext';
import type { msg_alert } from '../../types/globalTypes';
import CustomSnackbar from '../../utils/CustomSnackbar';

type NavBarProps = {
  isDrawerOpen: () => void; // function with no arguments returning nothing
};

export default function ButtonAppBar({ isDrawerOpen, title }: NavBarProps & { title: string }) {
  const { executeApi } = useApi();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // const {setSection, setProfile } = useAuth();
  const [Alert, setAlert] = useState<msg_alert>({ open: false, text: '', type: '' });
     
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

    const handleLogout = async () => {
    try {
      const response = await executeApi({method: 'POST',url: 'auth/logout'});
      if (response.text === 'LOGGEDOUT') {
        // setSection(null);
        // setProfile(null);
        navigate('/');
      } else {
        setAlert({
          open: true,
          text: response.text,
          type: response.type || 'error',
        });
      }
    } catch (error: any) {
      console.error(error);
      setAlert({
        open: true,
        text: error.message || 'Logout failed',
        type: 'error',
      });
    }
  };

  return (
    <Box sx={{ flexGrow: 1, zIndex: 9999 }}>
       <CustomSnackbar
        open={Alert.open}
        message={Alert.text}
        severity={Alert.type}
        duration={Alert.duration}
        onClose={() => setAlert({ ...Alert, open: false })}
      />
      <AppBar position="fixed">
        <Toolbar sx={{ maxHeight: "var(--max-appbar-height)", minHeight: '0 !important', border: '0px solid transparent' }}>
          {/* LEFT SECTION */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1,flexGrow:1 }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={isDrawerOpen}
            >
              <MenuIcon />
            </IconButton>
            <Typography noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>Aqgen</Typography>
          </Box>

          {/* CENTER SECTION */}
          <Box sx={{ flexGrow: 3, textAlign: 'center' }}>
            <Typography component="div">{title}</Typography>
          </Box>

          {/* RIGHT SECTION */}
          <Box sx={{flexGrow:1,textAlign:'right'}}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>

            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              sx={{zIndex:'9999'}}
            >
              {/* <MenuItem onClick={() => { handleClose(); navigate('/dashboard/profile'); }}>
                Profile
              </MenuItem> */}
              <MenuItem onClick={()=> {handleClose();handleLogout()}}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

    </Box>
  );
}
