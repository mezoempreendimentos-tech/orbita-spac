import https from "node:https";

const target = new URL("https://oauth2.googleapis.com/token");
const request = https.request({
  protocol: target.protocol,
  hostname: target.hostname,
  path: target.pathname,
  method: "POST",
  family: 4,
  agent: false,
  headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": "0", "User-Agent": "ORBITA/1.0" },
}, response => {
  const chunks = [];
  response.on("data", chunk => chunks.push(Buffer.from(chunk)));
  response.on("end", () => console.log(JSON.stringify({ status: response.statusCode, body: Buffer.concat(chunks).toString("utf8") })));
});

request.on("socket", socket => {
  socket.on("lookup", (...args) => console.log("lookup", args.slice(0, 3)));
  socket.on("connect", () => console.log("tcp_connected"));
  socket.on("secureConnect", () => console.log("tls_connected"));
  socket.on("error", error => console.log("socket_error", error.message));
});
request.setTimeout(10_000, () => request.destroy(new Error("request_timeout")));
request.on("error", error => console.log("request_error", error.message));
request.end();
