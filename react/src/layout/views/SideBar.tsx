import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider
} from '@mui/material';
import { Link } from 'react-router-dom';
import menu from '../../utils/sidebarConfig'
// import { useAuth } from '../../context/Authcontext';
// import {useApi} from '../../utils/GlobalApiWrapper';

interface SideBarProps {
  open: boolean;
  onClose: () => void;
}

export default function SideBar({ open, onClose }: SideBarProps) {
  // const {executeApi} = useApi()
  // const { section,setSection,setProfile} = useAuth();
  // later this will come from auth context
//  const userPermissions = section ? section.split('|') : [];

  const filteredMenu = menu.filter(section => section.permission === 'FORMATION'); // Filter based on permissions (for now hardcoded) 


  // useEffect(()=>{
  //   const fetchSideData = async()=>{
  //     let reqOptions ={
  //       method:'GET',
  //       url:'/api/fetchSidebarOptions'
  //     }
  //     try {
  //       if(!section){
  //         const response = await executeApi(reqOptions);
  //         setProfile(response.data.username)
  //         setSection(response.data.section)
  //       }
        
  //     } catch (error) {
  //       alert('unable to set table options')
  //     }
  //   }
  //   fetchSideData()
  //   },[])

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: 250 } }}
    >
      <Box role="presentation">
        {filteredMenu.map((section, index) => (
          <Box key={index}>
            <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 600, color: 'text.secondary' }}> {section.category} </Typography>
            <List disablePadding>
              {section.items.map((item, idx) => (
                <ListItemButton key={idx} component={Link} to={`/dashboard${item.path}`} onClick={onClose}>
                  {item.icon && (<ListItemIcon> {item.icon}</ListItemIcon>)}
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ))}
            </List>
            <Divider />
          </Box>
        ))}
      </Box>
    </Drawer>
  );
}
