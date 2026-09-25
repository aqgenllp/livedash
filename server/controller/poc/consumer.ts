// consumer.ts
import redis from "../../dbconnection/redis.js";
import DB from "../../dbconnection/db_ctrl.js";
import { broadcastData } from '../socket/productionDataBroadcaster.js'

const STREAMS = ["HOT_STREAM", "COLD_STREAM"];

function formatMySQLDateTime(value: string) {
  if (!value) return null;
  const d = new Date(value);
  return d.toISOString().slice(0, 19).replace("T", " ");
}


async function upsertHotstream(data: any, machine_id: string) {
  const connection = await DB.getConnection();
  let MACHINE_ID = machine_id;
  let FORMATION_ID = data.id;

  try {
    // ✅ Add required fields
    const payload: any = {
      ...data,
      formation_id: FORMATION_ID,
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

    console.log("✅ UPSERT HOT:", `modified : ${payload.machine_id + payload.formation_id}`);

  } catch (err) {
    console.error("❌ UPSERT ERROR:", err);
  } finally {
    connection.release();
  }
}

// Delete Hotstream
async function deleteHotstream(data: any, machine_id: string) {
  const connection = await DB.getConnection();

  try {
    await connection.query(
      `DELETE FROM formationsection_mst 
       WHERE formation_id = ? AND machine_id = ?`,
      [data.id, machine_id]
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

          let streamData: any;
          const operationType = parsed.type;
          const machine_id = parsed.machineId;

          // HOT STREAM
          if (streamName === "HOT_STREAM") {

            if (operationType === "INSERT") {
              streamData = parsed.data?.[0] || parsed.data;
              await upsertHotstream(streamData, machine_id);
              console.log(`Inserted [${streamName}]`, streamData.machine_id + streamData.formation_id);
            }
            else if (operationType === "UPDATE") {
              streamData = parsed.data[0]?.new || parsed.new;
              await upsertHotstream(streamData, machine_id);
               console.log(`Updated [${streamName}]`, streamData.machine_id + streamData.formation_id);
            }
            else if (operationType === "DELETE") {
              streamData = parsed.data?.old || parsed.old;
              await deleteHotstream(streamData, machine_id);
              console.log(`DELETED [${streamName}]`, streamData.machine_id + streamData.formation_id);
            }

            await broadcastData( machine_id,"production_data_update",streamData);
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