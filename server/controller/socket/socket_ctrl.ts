// socket.ts
import { WebSocketServer, WebSocket } from "ws";

const WSS_PORT = Number(process.env.WSS_PORT) || 3014;

const wss = new WebSocketServer({ port: WSS_PORT });

export interface ClientMeta {
  ws: WebSocket;
  machine_id: string;
  dbQueryType: string;
}

const clients: ClientMeta[] = [];

wss.on("connection", (ws) => {
  console.log("🔌 New client connected");
  console.log(`Running on port ${WSS_PORT}`);


  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "web_socket_register" && !clients.some((c) => c.machine_id === data.machine_id)) {
        const clientMeta: ClientMeta = { ws,machine_id: data.machine_id,dbQueryType: data.queryType};
        clients.push(clientMeta);
        console.log("✅ Client Registered:", data.machine_id);
      }

      if (data.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", text:'success', timestamp: Date.now()}));
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

console.log(`🚀 WebSocket running on ${WSS_PORT}`);

export { clients, wss };