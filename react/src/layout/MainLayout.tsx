import { Box } from '@mui/material'
import { useState } from 'react'
import NavBar from './views/NavBar';
import SideBar from './views/SideBar';
import { Outlet, useLocation } from "react-router-dom";
import menu, { type MachineSection } from '../utils/sidebarConfig';

function getPageTitle(pathname: string): string {
  for (const section of menu) {
    for (const item of section.items) {
      if (`/dashboard${item.path}` === pathname) {
        return item.Title;
      }
    }
  }
  return 'DASHBOARD';
}

function MainLayout({ machineSection }: { machineSection: MachineSection }) {
    const location = useLocation();
    const pageTitle = getPageTitle(location.pathname);
    let [isOpen, setIsOpen] = useState(false);

    let toggleButton = () => {
        setIsOpen(prev => !prev)
    }
    return (

        <Box sx={{ display: "flex", height: "100vh", overflow: "hidden"}}>
            <Box sx={{ display: "flex", flexDirection: "column"}}>
            <NavBar isDrawerOpen={toggleButton} title={pageTitle}></NavBar>
            </Box>
            <SideBar open={isOpen} onClose={() => setIsOpen(false)} machineSection={machineSection}></SideBar>
            <Box sx={{ flexGrow: 1, mt: "var(--max-appbar-height)", mb: 1,width:'100%', height: "calc(100vh - var(--max-appbar-height) - 8px)",p:1,overflow: "hidden",display: "flex", flexDirection: "column" }}>
                <Outlet />
            </Box>
        </Box>
    )
}

export default MainLayout