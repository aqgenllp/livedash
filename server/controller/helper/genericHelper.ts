import type { Request, Response} from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import os from 'os';
import DB from '../../dbconnection/db_ctrl.js';

type MachineData = RowDataPacket & {
    server_id: number;
    section: string;
    line: string;
};

const normalize = (val: any) => val === undefined || val === "undefined" || val === "null" || val === "" ? null : val;

const getClientIp = (req: Request): string | null => {

  let ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || null;

  // remove IPv6 prefix
  if (typeof ip === "string") {
    ip = ip.replace(/^::ffff:/, "");

    // if multiple IPs
    // ip = ip.split(",")[0].trim();
  }

  // localhost case
  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    const networkInterfaces = os.networkInterfaces();

    for (const [name, interfaces] of Object.entries(networkInterfaces)) {
      if (!interfaces) continue;

      // skip virtual adapters
      if (name.includes("vEthernet") || name.toLowerCase().includes("wsl") || name.toLowerCase().includes("docker") || name.toLowerCase().includes("virtual")) {
        continue;
      }

      for (const details of interfaces) {
        if (details.family === "IPv4" && !details.internal) {
          console.log(`Local LAN IP: ${details.address}`);
          return details.address;
        }
      }
    }
  }
  console.log(`Client IP: ${ip}`);
  return ip;
};

const getMachineData = async (req: Request, res: Response): Promise<Response | any> => {
    const machine_ip = getClientIp(req);

    if (!machine_ip) {
        return res.status(400).json({text: "DEFAULT_IP",type: "error"});
    }

    const query = `SELECT di.line,di.section,di.server_id,jm.batchNo,jm.status 
    FROM device_info di 
    LEFT JOIN jobchange jm ON jm.line_no = di.line
    WHERE di.ip = '${machine_ip}' AND jm.status = 'RUNNING'`;

    const batchListQuery =`SELECT Batchno From jobchange WHERE status = "RUNNING"`;
    try {
        const [rows] = await DB.query<MachineData[]>(query, [machine_ip]);
        const machine = rows[0];

        if (!machine) {
        const [batchRows] = await DB.query<RowDataPacket[]>(batchListQuery);
        const batchList = batchRows.map(row => row.Batchno);
            return res.status(200).json({
                text: `MACHINE NOT REGISTERED`,
                type: "warning",
                data: batchList 
            });
        }

        return res.status(200).json({
            text: "MACHINE DATA FOUND",
            type: "success",
            data: machine
        });
    } catch (error) {
        console.error("Error fetching machine data:", error);
        return res.status(500).json({
            text: "Error fetching machine data",
            type: "error"
        });
    }
};

   

export { normalize,getMachineData,getClientIp};