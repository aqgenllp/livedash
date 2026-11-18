// import InventoryIcon from '@mui/icons-material/Inventory';
// import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
// import AssessmentIcon from '@mui/icons-material/Assessment';
import SortIcon from '@mui/icons-material/Sort';
import type { ReactElement } from 'react';

export type MachineSection = 'HOT' | 'COLD' | 'UNREGISTERED';

const menu: {
  category: string;
  permission: MachineSection;
  items: {
    label: string;
    path: string;
    icon: ReactElement;
    Title: string;
  }[];
}[] = [
  {
    category: 'Formation',
    permission: 'HOT',
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
      }
    ]
  },
  {
    category: 'Production',
    permission: 'UNREGISTERED',
    items: [
      {
        label: 'Production Monitor',
        path: '/production/monitor',
        icon: <SortIcon />,
        Title: 'PRODUCTION MONITOR'
      }
    ]
  },
  {
    category: 'Cosmetic',
    permission: 'COLD',
    items: [
      {
        label: 'Cosmetic Section',
        path: '/production/cosmetic',
        icon: <SortIcon />,
        Title: 'COSMETIC SECTION'
      }
    ]
  }
];

export default menu;