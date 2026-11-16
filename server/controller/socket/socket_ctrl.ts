// socket.ts
import { WebSocketServer, WebSocket } from "ws";

const WSS_PORT = Number(process.env.SERVER_WSS_PORT) || 3001;
const wss = new WebSocketServer({ port: WSS_PORT });

export interface ClientMeta {
  ws: WebSocket;
  machine_id: string;
  dbQueryType: string;
}

const clients: ClientMeta[] = [];

wss.on("connection", (ws) => {
  console.log(`🔌New connection on port ${WSS_PORT}`);
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "WEBSOCKET_REGISTER" && !clients.some((c) => c.machine_id === data.machine_id)) {
        const clientMeta: ClientMeta = { ws,machine_id: data.machine_id,dbQueryType: data.queryType};
        clients.push(clientMeta);
        console.log("✅ CLIENT REGISTERED:", data.machine_id);
      }

      if (data.type === "HEARTBEAT") {
        console.log("✅ HEARTBEAT RECEIVED:", JSON.stringify(data));
        ws.send(JSON.stringify({ data:data, type: "HEARTBEAT_ACK", timestamp: Date.now() }));
      }

      if (data.type === "PING") {
        ws.send(JSON.stringify({ type: "PONG", text:'success', timestamp: Date.now()}));
      }
    } catch {
      console.error("❌ Invalid JSON");
    }
  });

  ws.on("close", () => removeClient(ws));
  ws.on("error", () => removeClient(ws));
});

function removeClient(ws: WebSocket) {
  const index = clients.findIndex((c) => c.ws === ws);

  if (index !== -1) {
    clients.splice(index, 1);
    console.log(`❌ Client removed. Remaining: ${clients.length}`);
  }
}

export { clients, wss };