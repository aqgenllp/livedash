import type { Request, Response } from "express";
import { ExecuteQuery } from "../../dbconnection/query_helper.js";
import DB from "../../dbconnection/db_ctrl.js";
import { normalize } from "../helper/genericHelper.js";
const normalizeDate = (value?: unknown): string => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw;
  }
  const isoParts = new Date().toISOString().split("T");
  return isoParts[0] ?? "";
};

const normalizeLineName = (value?: unknown): string | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || raw.trim().length === 0) return null;
  return raw.startsWith("Line-") ? raw : `Line-${raw}`;
};

const getAvailableProductionLines = async (req: Request, res: Response) => {
  try {
    const date = normalizeDate(req.query.date);

    const query = `
      SELECT DISTINCT line_name AS lineName
      FROM (
        SELECT line_name FROM formationsection_mst WHERE shift_date = ?
        UNION
        SELECT line_name FROM cosmetic_mst WHERE shift_date = ?
      ) x
      ORDER BY line_name;
    `;

    const result = await ExecuteQuery(query, [date, date]);
    return res.status(200).json({
      text: "AVAILABLE LINES FETCHED",
      type: "success",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      text: "ERROR FETCHING AVAILABLE LINES",
      type: "error",
    });
  }
};

const getProductionOverviewByDate = async (req: Request, res: Response) => {
  try {
    const date = normalizeDate(req.query.date);

    const query = `
      SELECT
        line_name,
        SUM(forming_total_produced) AS forming_total_produced,
        SUM(forming_total_rejected) AS forming_total_rejected,
        IF(SUM(forming_total_produced)=0, 0, ROUND((SUM(forming_total_produced) - SUM(forming_total_rejected)) / SUM(forming_total_produced) * 100, 2)) AS forming_yield_percent,
        SUM(cosmetic_total_produced) AS cosmetic_total_produced,
        SUM(cosmetic_total_rejected) AS cosmetic_total_rejected,
        IF(SUM(cosmetic_total_produced)=0, 0, ROUND((SUM(cosmetic_total_produced) - SUM(cosmetic_total_rejected)) / SUM(cosmetic_total_produced) * 100, 2)) AS cosmetic_yield_percent,
        SUM(forming_total_produced + cosmetic_total_produced) AS total_produced,
        SUM(forming_total_rejected + cosmetic_total_rejected) AS total_rejected,
        IF(
          (SUM(forming_total_produced) + SUM(cosmetic_total_produced)) = 0,
          0,
          ROUND(
            ((SUM(forming_total_produced) + SUM(cosmetic_total_produced)) - (SUM(forming_total_rejected) + SUM(cosmetic_total_rejected)))
            / (SUM(forming_total_produced) + SUM(cosmetic_total_produced))
            * 100,
            2
          )
        ) AS combined_yield_percent
      FROM (
        SELECT
          line_name,
          SUM(total_produced) AS forming_total_produced,
          SUM(total_rejected) AS forming_total_rejected,
          0 AS cosmetic_total_produced,
          0 AS cosmetic_total_rejected
        FROM formationsection_mst
        WHERE shift_date = ?
        GROUP BY line_name
        UNION ALL
        SELECT
          line_name,
          0 AS forming_total_produced,
          0 AS forming_total_rejected,
          SUM(total_produced) AS cosmetic_total_produced,
          SUM(total_rejected) AS cosmetic_total_rejected
        FROM cosmetic_mst
        WHERE shift_date = ?
        GROUP BY line_name
      ) aggregated
      GROUP BY line_name
      ORDER BY line_name;
    `;

    const result = await ExecuteQuery(query, [date, date]);
    return res.status(200).json({
      text: "PRODUCTION OVERVIEW FETCHED",
      type: "success",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      text: "ERROR FETCHING PRODUCTION OVERVIEW",
      type: "error",
    });
  }
};

const getLineShiftDetailsByDate = async (req: Request, res: Response) => {
  try {
    const date = normalizeDate(req.query.date);
    const lineName = normalizeLineName(req.params.line);

    if (!lineName) {
      return res.status(400).json({
        text: "Missing production line",
        type: "error",
      });
    }

    const query = `
      SELECT
        COALESCE(f.line_name, c.line_name) AS line_name,
        COALESCE(f.shift_name, c.shift_name) AS shift_name,
        COALESCE(f.shift_date, c.shift_date) AS shift_date,
        f.total_produced AS forming_total_produced,
        f.total_rejected AS forming_total_rejected,
        f.yield_percent AS forming_yield_percent,
        f.machine_speed AS forming_machine_speed,
        c.total_produced AS cosmetic_total_produced,
        c.total_rejected AS cosmetic_total_rejected,
        c.yield_percent AS cosmetic_yield_percent,
        c.inspection_speed AS cosmetic_inspection_speed
      FROM formationsection_mst f
      LEFT JOIN cosmetic_mst c
        ON f.line_name = c.line_name
        AND f.shift_date = c.shift_date
        AND f.shift_name = c.shift_name
      WHERE f.line_name = ?
        AND f.shift_date = ?
      UNION ALL
      SELECT
        COALESCE(f.line_name, c.line_name) AS line_name,
        COALESCE(f.shift_name, c.shift_name) AS shift_name,
        COALESCE(f.shift_date, c.shift_date) AS shift_date,
        f.total_produced AS forming_total_produced,
        f.total_rejected AS forming_total_rejected,
        f.yield_percent AS forming_yield_percent,
        f.machine_speed AS forming_machine_speed,
        c.total_produced AS cosmetic_total_produced,
        c.total_rejected AS cosmetic_total_rejected,
        c.yield_percent AS cosmetic_yield_percent,
        c.inspection_speed AS cosmetic_inspection_speed
      FROM cosmetic_mst c
      LEFT JOIN formationsection_mst f
        ON f.line_name = c.line_name
        AND f.shift_date = c.shift_date
        AND f.shift_name = c.shift_name
      WHERE c.line_name = ?
        AND c.shift_date = ?
        AND f.line_name IS NULL
      ORDER BY shift_name;
    `;

    const result = await ExecuteQuery(query, [lineName, date, lineName, date]);
    return res.status(200).json({
      text: "PRODUCTION LINE DETAILS FETCHED",
      type: "success",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      text: "ERROR FETCHING PRODUCTION LINE DETAILS",
      type: "error",
    });
  }
};

const getBatchData = async (req: Request, res: Response) => {
  try {
    const normalize = (val: any) =>
      val === undefined || val === "undefined" || val === "null" || val === ""
        ? null
        : val;

    let { batch_no, article_code, startDate, endDate, today } = req.body;

    const BatchNo = normalize(batch_no);
    const ArticleCode = normalize(article_code);
    const StartDate = normalize(startDate);
    const EndDate = normalize(endDate);
    const Today = normalize(today);

    let query = `SELECT *
      FROM batch_mst WHERE 1=1
        AND (? IS NULL OR batch_no = ?)
        AND (? IS NULL OR article_code = ?)
        AND (? IS NULL OR batch_start_date >= ?)
        AND (? IS NULL OR batch_start_date <= ?)
    `;

    let params = [
      BatchNo,
      BatchNo,
      ArticleCode,
      ArticleCode,
      StartDate,
      StartDate,
      EndDate,
      EndDate,
    ];

    if (Today) {
      query += ` AND DATE(batch_start_date) = CURDATE()`;
    }

    query += ` ORDER BY id DESC`;

    // 1. Execute main query
    const [rows]: any = await DB.query(query, params);

    // Fallback
    if (
      (!BatchNo && !ArticleCode && !StartDate && !EndDate && !Today) ||
      rows.length === 0
    ) {
      const [latest]: any = await DB.query(
        `SELECT * FROM batch_mst ORDER BY id DESC LIMIT 20`,
      );
      return res.json({
        text: "Batch Data Fetched",
        type: "success",
        data: latest,
      });
    }

    // ELSE Filtered data
    return res.json({
      text: "Batch Data Fetched",
      type: "success",
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getProductionOverallData = async (req: Request, res: Response) => {
  try {
    const { selectedBatch, machineId, prod_start_date, prod_end_date, today, article, batch_start, batch_end, shift } = req.body;

    // NORMALIZE
    let MACHINE_ID = normalize(machineId);
    const BATCH_NO = normalize(selectedBatch);
    let START_DATE = normalize(prod_start_date);
    let END_DATE = normalize(prod_end_date);

    const TODAY = normalize(today);

    // IF TODAY SELECTED AND NO DATE FILTERS
    if (TODAY && !START_DATE && !END_DATE) {
      const currentDate = new Date().toISOString().split("T")[0];
      START_DATE = currentDate;
      END_DATE = currentDate;
    }

    const startDateTime = START_DATE ? `${START_DATE} 00:00:00` : null;
    const endDateTime = END_DATE ? `${END_DATE} 23:59:59` : null;

    let FinalData: any = {};

    // 1. GET ALL LINES + RUNNING BATCHES
    const batchQuery = `
SELECT 
(
    SELECT JSON_ARRAYAGG(t.line_no)
    FROM (
        SELECT DISTINCT line_no
        FROM jobchange_mst
        WHERE status = 'RUNNING'
    ) t
) AS TotalLines,

(
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'line_no', jm.line_no,
            'Article', jm.Article,
            'batchNo', jm.batchNo,
            'VialType', jm.VialType,
            'batchSDT', jm.batchSDT,
            'batchEDT', jm.batchEDT,
            'machineId', jm.line_no,
            'ArticleCode', jm.ArticleCode,
            'Batchqty', jm.Batchqty,
            'status', jm.status
        )
    )
    FROM jobchange_mst jm
    WHERE jm.status = 'RUNNING'
) AS BatchData
`;

  

    const [batchResult]: any = await DB.query(batchQuery);
    FinalData["batchInfo"] = batchResult[0] || {};

    if (!MACHINE_ID && FinalData.batchInfo?.BatchData?.[0]?.line_no) {
      MACHINE_ID = FinalData.batchInfo.BatchData[0].line_no;
    }

    // 2. COMMON FILTERS
    let commonWhere = `
      WHERE 1=1
      AND (? IS NULL OR machine_id = ?)
      AND (? IS NULL OR batchNo = ?)
      AND (? IS NULL OR cDate >= ?)
      AND (? IS NULL OR cDate <= ?)
    `;

    let hotSectionValues = [
      `${MACHINE_ID}_HOT`,
      `${MACHINE_ID}_HOT`,
      BATCH_NO,
      BATCH_NO,
      startDateTime,
      startDateTime,
      endDateTime,
      endDateTime,
    ];

    let coldSectionValues = [
      `${MACHINE_ID}_COLD`,
      `${MACHINE_ID}_COLD`,
      BATCH_NO,
      BATCH_NO,
      startDateTime,
      startDateTime,
      endDateTime,
      endDateTime,
    ];

    // 3. FORMATION DATA
    let formationQuery = `SELECT * FROM formationsection_mst ${commonWhere} ORDER BY cDate DESC`;
    const [formationData]: any = await DB.query(formationQuery, hotSectionValues);

    // 4. COSMETIC DATA
    let cosmeticQuery = `SELECT * FROM cosmetic_mst ${commonWhere} ORDER BY cDate DESC`;
    const [cosmeticData]: any = await DB.query(cosmeticQuery, coldSectionValues);

    // 5. LATEST FORMATION DATA SHIFT WISE
    let latestFormationQuery = `
  SELECT f1.* 

  FROM formationsection_mst f1

  INNER JOIN (

    SELECT
      machine_id,
      batchNo,

      DATE(cDate) AS productionDate,

      CASE
        WHEN TIME(cDate) >= '06:00:00'
          AND TIME(cDate) < '14:00:00'
        THEN 'Shift-A'

        WHEN TIME(cDate) >= '14:00:00'
          AND TIME(cDate) < '22:00:00'
        THEN 'Shift-B'

        ELSE 'Shift-C'
      END AS shift_name,

      MAX(cDate) AS latest_time

    FROM formationsection_mst

    ${commonWhere}

    GROUP BY
      machine_id,
      batchNo,
      productionDate,
      shift_name

  ) latest

  ON f1.machine_id = latest.machine_id
  AND f1.batchNo = latest.batchNo
  AND f1.cDate = latest.latest_time

  ORDER BY f1.cDate DESC
`;

    const [latestFormationData]: any = await DB.query(
      latestFormationQuery,
      hotSectionValues
    );

    // =====================================================
    // 6. LATEST COSMETIC DATA SHIFT WISE
    // =====================================================

    let latestCosmeticQuery = `
      SELECT c1.*
      FROM cosmetic_mst c1
      INNER JOIN (
        SELECT
          machine_id,
          batchNo,
          DATE(cDate) AS productionDate,
          CASE
            WHEN TIME(cDate) >= '06:00:00'
              AND TIME(cDate) < '14:00:00'
            THEN 'Shift-A'

            WHEN TIME(cDate) >= '14:00:00'
              AND TIME(cDate) < '22:00:00'
            THEN 'Shift-B'

            ELSE 'Shift-C'
          END AS shift_name,

          MAX(cDate) AS latest_time

        FROM cosmetic_mst
        ${commonWhere}
        GROUP BY
          machine_id,
          batchNo,
          productionDate,
          shift_name
      ) latest
      ON c1.machine_id = latest.machine_id
      AND c1.batchNo = latest.batchNo
      AND c1.cDate = latest.latest_time
      ORDER BY c1.cDate DESC
    `;

    const [latestCosmeticData]: any = await DB.query(latestCosmeticQuery, coldSectionValues);

    // 7. FINAL RESPONSE
    FinalData["formationData"] = formationData;
    FinalData["cosmeticData"] = cosmeticData;
    FinalData["latestFormationData"] = latestFormationData;
    FinalData["latestCosmeticData"] = latestCosmeticData;

    return res.status(200).json({
      success: true,
      text: "PRODUCTION DATA FETCHED",
      type: "success",
      data: FinalData,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      text: "ERROR FETCHING PRODUCTION DATA",
      type: "error",
      data: [],
    });
  }
};

export {
  getAvailableProductionLines,
  getProductionOverviewByDate,
  getLineShiftDetailsByDate,
  getBatchData,
  getProductionOverallData,
};
