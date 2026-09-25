import type { Request, Response } from 'express';
import { ExecuteQuery } from '../../dbconnection/query_helper.js';
import { normalize } from '../helper/genericHelper.js'

let CosmeticSectionFilteredData = async (req: Request, res: Response) => {

  let { batchNo, machineId, shift, startDate, endDate, today } = req.body;

  try {

    const MACHINE_ID = normalize(machineId);
    const BATCH_NO = normalize(batchNo);
    const SHIFT = normalize(shift);

    let START_DATE = normalize(startDate);
    let END_DATE = normalize(endDate);

    const TODAY = normalize(today);

    // TODAY FILTER
    if (TODAY) {

      const currentDate = new Date();

      START_DATE = currentDate.toLocaleDateString('en-CA');
      END_DATE = START_DATE;
    }

    // DEFAULT LAST 3 DAYS
    if (!START_DATE && !END_DATE) {

      const currentDate = new Date();

      const last3Days = new Date();

      last3Days.setDate(currentDate.getDate() - 2);

      START_DATE = last3Days.toLocaleDateString('en-CA');

      END_DATE = currentDate.toLocaleDateString('en-CA');
    }

    // DATE RANGE
    const startDateTime = START_DATE
      ? `${START_DATE} 00:00:00`
      : null;

    const endDateTime = END_DATE
      ? `${END_DATE} 23:59:59`
      : null;

    const query = `

      WITH shift_data AS (

        SELECT
          csm.*,

          CASE
            WHEN TIME(csm.cDate) BETWEEN '06:00:00' AND '13:59:59'
              THEN 'Shift-A'

            WHEN TIME(csm.cDate) BETWEEN '14:00:00' AND '21:59:59'
              THEN 'Shift-B'

            ELSE 'Shift-C'
          END AS shift_name,

          CASE
            WHEN TIME(csm.cDate) < '06:00:00'
              THEN DATE_SUB(DATE(csm.cDate), INTERVAL 1 DAY)

            ELSE DATE(csm.cDate)
          END AS production_date

        FROM cosmetic_mst csm

        WHERE
          (? IS NULL OR csm.machine_id = ?)
          AND (? IS NULL OR csm.batchNo = ?)
          AND (? IS NULL OR csm.cDate >= ?)
          AND (? IS NULL OR csm.cDate <= ?)

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

    console.log(values);

    const result = await ExecuteQuery(query, values);

    if (result.length === 0) {

      return res.status(400).json({
        text: "NO DATA FOUND FOR GIVEN FILTERS",
        type: "warning",
        data: []
      });

    }

    return res.status(200).json({
      text: "COSMETIC DATA FETCHED",
      type: "success",
      data: result
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      text: "ERROR FETCHING DATA",
      type: "error"
    });

  }

};


export { CosmeticSectionFilteredData }; 