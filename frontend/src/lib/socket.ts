// make sure versions of socket.io client/server match (e.g. both 4.x)
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (socket) return socket;

  const isProd = process.env.NODE_ENV === "production";

  const URL = isProd ? undefined : "http://localhost:5000";

  const token = typeof window !== "undefined"
    ? localStorage.getItem("token")
    : undefined;

  socket = io(URL, {
    path: "/socket.io",
    transports: ["websocket"],
    withCredentials: true,
    reconnectionAttempts: 5,
    timeout: 10000,
    auth: token ? { token } : undefined,
  });

  
  socket.on("connect", () => {
    // eslint-disable-next-line no-console
    console.log("[socket] connected", socket?.id);
  });
  socket.on("connect_error", (err) => {
    console.error("[socket] connect_error:", err?.message || err);
  });
  socket.on("error", (err) => {
    console.error("[socket] error:", err);
  });

  return socket;
}
