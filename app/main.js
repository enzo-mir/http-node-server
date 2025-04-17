const net = require("net");
console.log("Logs from your program will appear here!");
const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
    server.close();
  });

  socket.on("data", (data) => {
    const initialPath = data.toString().split(" ")[1];
    const acceptedPaths = [
      { path: "/echo", dynamic: true },
      { path: "/user-agent", dynamic: false },
      { path: "/", dynamic: false },
    ];

    const userAgent = initialPath === "/user-agent" ? data.toString().split("User-Agent: ", data.toString().length)[1].trim() : undefined;

    const path = initialPath.includes("echo") ? initialPath.split("/")[2] : initialPath;

    const response = (id = 0) => {
      if (id >= acceptedPaths.length) return "404 Not Found";
      if (acceptedPaths[id].dynamic ? initialPath.startsWith(acceptedPaths[id]) : initialPath === acceptedPaths[id]) {
        return "200 OK";
      }
      return response(id + 1);
    };

    socket.write(
      `HTTP/1.1 ${response()}\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent ? userAgent.length : path.length}\r\n\r\n${
        userAgent || path
      }`
    );
  });
});

server.listen(4221, "localhost");
