import express from 'express';
const homeRouter = express.Router();

// Formation Section
import {FormationSectionFilteredData} from '../controller/formation/formation_ctrl.js';
homeRouter.post('/formationInLineFilterBasedOnShift',FormationSectionFilteredData);


// Cosmetic Section
import {CosmeticSectionFilteredData} from '../controller/cosmetic/cosmetic_ctrl.js';
homeRouter.post('/cosmeticLineData',CosmeticSectionFilteredData);


import {
  getAvailableProductionLines,
  getProductionOverviewByDate,
  getLineShiftDetailsByDate,
  getProductionOverallData,
} from '../controller/production/production_ctrl.js' 

homeRouter.post('/productionData',getProductionOverallData)
homeRouter.get('/production/lines', getAvailableProductionLines);
homeRouter.get('/production/overview', getProductionOverviewByDate);
homeRouter.get('/production/lines/:line/shifts', getLineShiftDetailsByDate);



// helper functionS
import {getMachineData } from '../controller/helper/genericHelper.js';
homeRouter.get('/clientData', getMachineData);

export default homeRouter; 