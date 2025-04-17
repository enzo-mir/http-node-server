const net = require("net");
const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
    server.close();
  });

  socket.on("data", (data) => {
    const userAgent = data.toString().split("User-Agent: ", data.toString().length)[1]?.trim();

    const initialPath = data.toString().split(" ")[1];

    const response = "200 OK";

    socket.write(`HTTP/1.1 ${response}\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent?.length || "0"}\r\n\r\n${userAgent}`);
  });
});

server.listen(4221, "localhost");
