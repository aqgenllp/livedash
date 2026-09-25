import type { Request, Response } from 'express';
import { ExecuteQuery } from '../../dbconnection/query_helper.js';
import { normalize } from '../helper/genericHelper.js';



let FormationSectionFilteredData = async (req: Request, res: Response) => {

  let {
    batchNo,
    machineId,
    shift,
    startDate,
    endDate,
    today
  } = req.body;

  try {

    const MACHINE_ID = normalize(machineId);
    const BATCH_NO = normalize(batchNo);
    const SHIFT = normalize(shift);
    let START_DATE = normalize(startDate);
    let END_DATE = normalize(endDate);
    const TODAY = normalize(today);

    // TODAY FILTER
    if (TODAY) {
      START_DATE = new Date().toISOString().split("T")[0];
      END_DATE = START_DATE;
    }

    // DEFAULT LAST 3 DAYS
    if (!START_DATE && !END_DATE) {
      const todayDate = new Date();
      const last3Days = new Date();
      last3Days.setDate(todayDate.getDate() - 2);
      START_DATE = last3Days.toISOString().split("T")[0];
      END_DATE = todayDate.toISOString().split("T")[0];
    }

    // DATE TIME RANGE
    const startDateTime = START_DATE ? `${START_DATE} 00:00:00` : null;
    const endDateTime = END_DATE ? `${END_DATE} 23:59:59` : null;

    // MAIN QUERY
    const query = `
      WITH shift_data AS (
        SELECT
          fsm.*,
          CASE
            WHEN TIME(fsm.cDate) BETWEEN '06:00:00' AND '13:59:59'
              THEN 'Shift-A'
            WHEN TIME(fsm.cDate) BETWEEN '14:00:00' AND '21:59:59'
              THEN 'Shift-B'
            ELSE 'Shift-C'
          END AS shift_name,
          CASE
            -- SHIFT C BEFORE 6AM BELONGS TO PREVIOUS DAY
            WHEN TIME(fsm.cDate) < '06:00:00'
              THEN DATE_SUB(DATE(fsm.cDate), INTERVAL 1 DAY)
            ELSE DATE(fsm.cDate)
          END AS production_date
        FROM formationsection_mst fsm
        WHERE
          (? IS NULL OR fsm.machine_id = ?)
          AND (? IS NULL OR fsm.batchNo = ?)
          AND (? IS NULL OR fsm.cDate >= ?)
          AND (? IS NULL OR fsm.cDate <= ?)
      ),

      ranked_data AS (
        SELECT
          sd.*,
          ROW_NUMBER() OVER (
            PARTITION BY
              sd.production_date,
              sd.shift_name,
              sd.machine_id,
              sd.batchNo
            ORDER BY sd.cDate DESC
          ) AS rn
        FROM shift_data sd
        WHERE
          (? IS NULL OR sd.shift_name = ?)
      )
      SELECT *
      FROM ranked_data
      WHERE rn = 1
      ORDER BY cDate ASC
    `;

    const values = [
      MACHINE_ID, MACHINE_ID,
      BATCH_NO, BATCH_NO,
      startDateTime, startDateTime,
      endDateTime, endDateTime,
      SHIFT, SHIFT
    ];

    const result = await ExecuteQuery(query, values);

    // NO DATA
    if (result.length === 0) {
      return res.status(400).json({text: "NO DATA FOUND FOR GIVEN FILTERS", type: "warning",data: []});
    }
    return res.status(200).json({text: "FORMATION DATA FETCHED",type: "success",data: result});
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      text: "ERROR FETCHING DATA",
      type: "error"
    });
  }

};

export { FormationSectionFilteredData }