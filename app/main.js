const net = require("net");
console.log("Logs from your program will appear here!");
const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
    server.close();
  });

  socket.on("data", (data) => {
    const initialPath = data.toString().split(" ")[1];
    const acceptedPaths = ["/echo", "/user-agent", "/"];

    const userAgent = initialPath === "/user-agent" ? data.toString().split("User-Agent: ", data.toString().length)[1].trim() : undefined;

    const path = initialPath.includes("echo") ? initialPath.split("/")[2] : initialPath;

    const response = (id = 0) => {
      if (initialPath.startsWith(acceptedPaths[id])) {
        return "200 OK";
      } else {
        if (id < acceptedPaths.length) {
          return response(id++);
        }
        return "404 Not Found";
      }
    };

    socket.write(
      `HTTP/1.1 ${response()}\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent ? userAgent.length : path.length}\r\n\r\n${
        userAgent || path
      }`
    );
  });
});

server.listen(4221, "localhost");
