// dbconnection/redis.ts
import { Redis } from 'ioredis';

const redisClient = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

redisClient.on("connect", () => {
  console.log("✅ Redis Connected");
});

redisClient.on("error", (err: any) => {
  console.error("❌ Redis Error:", err);
});

export default redisClient;