import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
import type { DbCredentials } from '../controller/types/commonTypes.js';

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing env: ${name}`);
    return value;
}

const dbConfig: DbCredentials = {
    host: requireEnv('DB_HOST'),
    user: requireEnv('DB_USER'),
    password: requireEnv('DB_PASSWORD'),
    database: requireEnv('DB_NAME'),
    port: Number(requireEnv('DB_PORT')),
};

const DB = await mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
});

(async () => {
    try {
        const connection = await DB.getConnection();
        console.log("SERVER_DB CONNECTION SUCCESSFUL");
        connection.release();
    } catch (error) {
        console.error("SERVER_DB ERROR:", error);
    }
})();


export default DB ;