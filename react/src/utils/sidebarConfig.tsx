// import InventoryIcon from '@mui/icons-material/Inventory';
// import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
// import AssessmentIcon from '@mui/icons-material/Assessment';
import SortIcon from '@mui/icons-material/Sort';

const menu = [
  {
    category: 'Formation',
    permission: 'FORMATION',
    items: [
      {
        label: 'Formation Section',
        path: '/formation',
        icon: <SortIcon />,
        Title: 'FORMATION SECTION'
      },
      {
        label: 'Generate Report',
        path: '/formation/report',
        icon: <SortIcon />,
        Title: 'FORMATION REPORT'
      },
      {
        label: 'Production Monitor',
        path: '/production/monitor',
        icon: <SortIcon />,
        Title: 'PRODUCTION MONITOR'
      },{
        label: 'Cosmetic Section',
        path: '/production/cosmetic',
        icon: <SortIcon />,
        Title: 'COSMETIC SECTION'
      }
    ]
  }
];

export default menu;