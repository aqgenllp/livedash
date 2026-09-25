// broadcast.ts
import type { RowDataPacket } from "mysql2";
import { ExecuteQuery } from "../../dbconnection/query_helper.js";
import { clients } from "./socket_ctrl.js";
// import type {ClientMeta} from "./socket_ctrl.js";

const fetchDatafromDB = async (line_name: string) => {
  const query = `
    SELECT * 
    FROM formationsection_mst 
    WHERE line_name = ? 
    ORDER BY shift_date DESC 
    LIMIT 1
  `;

  const results = await ExecuteQuery<RowDataPacket[]>(query, [line_name]);

  return results;
};

const broadcastData = async (machine_id: string,dbQueryType: string,data: any) => {
  try {
    clients.forEach((client) => {
      if (client.machine_id === machine_id && client.dbQueryType === dbQueryType) {
        client.ws.send(JSON.stringify({ type: "production_data_update", result:data }));
      }
    });

    console.log("📡 Broadcast sent:", machine_id);
  } catch (err) {
    console.error("❌ Broadcast error:", err);
  }
};

export { broadcastData };