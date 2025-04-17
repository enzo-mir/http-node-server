const net = require("net");
console.log("Logs from your program will appear here!");
const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
    server.close();
  });

  socket.on("data", (data) => {
    const path = data.toString().split(" ")[1];
    const getStr = path.split("/")[2];

    socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${getStr.length || path.length}\r\n\r\n${getStr || path}`);
  });
});

server.listen(4221, "localhost");
