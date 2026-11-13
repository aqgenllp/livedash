import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import homeRouter from './routes/homeRouter.js';
import dotenv from 'dotenv';

// ✅ Load environment variables
dotenv.config();

// ✅ Initialize WebSocket server and Redis consumer
import './controller/socket/socket_ctrl.js';
import './controller/poc/consumer.js';


const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// // ✅ Serve React build folder (NOT file)
const reactBuildPath = path.resolve(process.cwd(),"..", "react", "dist");
console.log(reactBuildPath);
app.use(express.static(path.join(reactBuildPath)));

// API
app.use(cors({ credentials: true, origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', homeRouter);


// // ✅ Catch-all (Express 5 safe)
app.use((req, res) => {
  res.sendFile(path.join(reactBuildPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});