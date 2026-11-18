// consumer.ts
import redis from "../../dbconnection/redis.js";
import DB from "../../dbconnection/db_ctrl.js";
import { broadcastData } from '../socket/productionDataBroadcaster.js'

const STREAMS = ["HOT_STREAM", "COLD_STREAM"];


function formatMySQLDateTime(value: string | Date | null): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    // Preserve the original date/time instead of converting timezone.
    const match = value.match(
      /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/
    );

    if (match) {
      return `${match[1]} ${match[2]}`;
    }
  }

  if (value instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, "0");

    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())} ${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}:${pad(value.getUTCSeconds())}`;
  }

  return null;
}



async function upsertHotstream(data: any, machine_id: string,BatchNo: string) {
  const connection = await DB.getConnection();
  let MACHINE_ID = machine_id;
  // let FORMATION_ID = data.id;

  try {
    // ✅ Add required fields
    const payload: any = {
      ...data,
      batchNo: BatchNo,
      // formation_id: FORMATION_ID,
      machine_id: MACHINE_ID
    };

    if (payload.cDate) {
      payload.cDate = formatMySQLDateTime(payload.cDate);
    }

    // ❌ remove unwanted keys
    delete payload.id;

    // ✅ Build dynamic query
    const columns = Object.keys(payload);
    const placeholders = columns.map(() => "?").join(", ");

    const updates = columns.map(col => `${col} = VALUES(${col})`).join(", ");

    const values = Object.values(payload);

    const query = `INSERT INTO formationsection_mst (${columns.join(", ")}) VALUES (${placeholders})
      ON DUPLICATE KEY UPDATE ${updates}`;

    await connection.query(query, values);
    await connection.commit();

    // Update the WebSocket clients with the new data
    await broadcastData(machine_id, "production_data_update", payload);

    console.log("✅ UPSERT HOT:", `modified : ${payload.machine_id + payload.formation_id}`);

  } catch (err) {
    console.error("❌ UPSERT ERROR:", err);
  } finally {
    connection.release();
  }
}

async function updateHotstream(data: any, machine_id: string, BatchNo: string, matchCDate: string | Date) {
  const connection = await DB.getConnection();

  try {
    const payload: any = {
      ...data,
      batchNo: BatchNo,
      machine_id
    };

    payload.cDate = formatMySQLDateTime(payload.cDate);
    const formattedMatchCDate = formatMySQLDateTime(matchCDate);

    if (!payload.cDate || !formattedMatchCDate) {
      throw new Error("HOT_STREAM update requires a valid cDate");
    }

    delete payload.id;

    const columns = Object.keys(payload).filter(col => col !== "machine_id" && col !== "batchNo");
    if (columns.length === 0) {
      throw new Error("HOT_STREAM update has no fields to update");
    }

    const setClause = columns.map(col => `${col} = ?`).join(", ");
    const values = columns.map(col => payload[col]);
    const query = `UPDATE formationsection_mst SET ${setClause}
      WHERE cDate = ? AND machine_id = ? AND batchNo = ?`;

    await connection.query(query, [...values, formattedMatchCDate, machine_id, BatchNo]);
    await connection.commit();
    await broadcastData(machine_id, "production_data_update", payload);
  } catch (err) {
    console.error("❌ UPDATE HOT ERROR:", err);
    throw err;
  } finally {
    connection.release();
  }
}

// Delete Hotstream
async function deleteHotstream(data: any, machine_id: string, BatchNo: string, cDate: string | Date) {
  const connection = await DB.getConnection();

  try {
    const formattedCDate = formatMySQLDateTime(cDate);

    await connection.query(
      `DELETE FROM formationsection_mst 
       WHERE formation_id = ? AND machine_id = ? AND batchNo = ? AND cDate = ?`,
      [data.id, machine_id, BatchNo, formattedCDate]
    );

    await connection.commit();

  } finally {
    connection.release();
  }
}


// upsert for coldstream
async function upsertColdstream(data: any, machine_id: string) {
  const connection = await DB.getConnection();

  try {
    const payload: any = {
      formation_id: data.id,
      machine_id,
      ...data
    };

    if (payload.shift_time) {
      payload.shift_time = formatMySQLDateTime(payload.shift_time);
    }

    delete payload.id;

    const columns = Object.keys(payload);
    const placeholders = columns.map(() => "?").join(", ");
    const updates = columns.map(col => `${col}=VALUES(${col})`).join(", ");

    const query = `
      INSERT INTO cosmetic_mst (${columns.join(", ")})
      VALUES (${placeholders})
      ON DUPLICATE KEY UPDATE ${updates}
    `;

    await connection.query(query, Object.values(payload));
    await connection.commit();

  } finally {
    connection.release();
  }
}

// Delete Coldstream
async function deleteColdstream(data: any, machine_id: string) {
  const connection = await DB.getConnection();

  try {
    await connection.query(
      `DELETE FROM cosmetic_mst 
       WHERE formation_id = ? AND machine_id = ?`,
      [data.id, machine_id]
    );

    await connection.commit();

  } finally {
    connection.release();
  }
}

async function saveRedisCheckpoint(stream: string, lastId: string) {
  const machineId = `consumer_${stream.toLowerCase()}`;

  await DB.query(`
    INSERT INTO binlog_checkpoint (machine_id, redis_stream, redis_last_id)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      redis_last_id = VALUES(redis_last_id),
      redis_stream = VALUES(redis_stream)
  `, [machineId, stream, lastId]);
}

async function loadRedisCheckpoint(stream: string): Promise<string> {
  const machineId = `consumer_${stream.toLowerCase()}`;

  const [rows]: any = await DB.query(
    `SELECT redis_last_id FROM binlog_checkpoint WHERE machine_id = ?`,
    [machineId]
  );

  return rows.length ? rows[0].redis_last_id : "0";
}


let lastIds = await Promise.all([
  loadRedisCheckpoint("HOT_STREAM"),
  loadRedisCheckpoint("COLD_STREAM")
]);

async function startConsumer() {
  while (true) {
    const response = await redis.xread(
      "BLOCK",
      0,
      "STREAMS",
      ...STREAMS,
      ...lastIds
    );

    if (!response) continue;

    for (let i = 0; i < response.length; i++) {
      const [streamName, messages] = response[i] as any;

      for (const [id, fields] of messages) {
        try {
          const raw = fields[1];
          const parsed = JSON.parse(raw);
          const BatchNo = parsed.table; // Assuming the batch number is in the 'table' field

          let streamData: any;
          const operationType = parsed.type;
          const machine_id = parsed.machineId;

          // HOT STREAM
          if (streamName === "HOT_STREAM") {
            if (operationType === "INSERT") {
              streamData = parsed.data?.[0] || parsed.data;
              streamData["batchNo"] = BatchNo;
              await upsertHotstream(streamData, machine_id, BatchNo);
              console.log(`Inserted [${streamName}]`, streamData.machine_id + streamData.formation_id);
            }
            else if (operationType === "UPDATE") {
              const change = parsed.data?.[0] || parsed;
              streamData = change.new || parsed.new;
              const previousData = change.old || parsed.old || streamData;
              await updateHotstream(streamData, machine_id, BatchNo, previousData.cDate);
               console.log(`Updated [${streamName}]`, streamData.machine_id + streamData.formation_id);
            }
            else if (operationType === "DELETE") {
              streamData = parsed.data?.old || parsed.old;
              await deleteHotstream(streamData, machine_id,BatchNo, parsed.cDate);
              console.log(`DELETED [${streamName}]`, streamData.machine_id + streamData.formation_id);
              await broadcastData(machine_id, "production_data_update", streamData);
            }
          }

          // COLD STREAM
          else if (streamName === "COLD_STREAM") {

            if (operationType === "DELETE") {
              await deleteColdstream(streamData, machine_id);
            } else {
              await upsertColdstream(streamData, machine_id);
            }

            await broadcastData(machine_id,"production_data_update",streamData);
          }

          // ✅ Save checkpoint AFTER success
          lastIds[i] = id;
          await saveRedisCheckpoint(streamName, id);

        } catch (err) {
          console.error("❌ Processing error:", err);
        }
      }
    }
  }
}


startConsumer();