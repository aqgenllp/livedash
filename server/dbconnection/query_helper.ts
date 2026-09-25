import DB from './db_ctrl.js';
import type {RowDataPacket} from 'mysql2'

 async function ExecuteQuery<T extends RowDataPacket[]>(
  query: string,
  params?: any[]
): Promise<T> {
  const [results] = await DB.query<T>(query, params);
  return results;
}
export {ExecuteQuery}