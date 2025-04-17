const net = require("net");
console.log("Logs from your program will appear here!");
const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
    server.close();
  });

  socket.on("data", (data) => {
    const initialPath = data.toString().split(" ")[1];
    const path = initialPath.includes("echo") ? initialPath.split("/")[2] : initialPath;

    const response = path.includes("echo") ? "200 OK" : "404 Not Found";

    socket.write(`HTTP/1.1 ${response}\r\nContent-Type: text/plain\r\nContent-Length: ${path.length}\r\n\r\n${path}`);
  });
});

server.listen(4221, "localhost");
