const net = require("net");
const fs = require("fs");

function files() {
  const files = [];
  fs.readdirSync("./tmp", { recursive: true }).map((file) => {
    files.push(file);
  });

  return files;
}

const lisFiles = files();

function fileEndPointResponse(filename, id = 0) {
  if (id >= lisFiles.length) return { status: "404 Not Found" };
  if (lisFiles[id].includes(filename)) {
    const fileLength = fs.statSync("./tmp/" + lisFiles[id]).size;
    return { length: fileLength, status: "200 OK" };
  }
  return fileEndPointResponse(filename, id + 1);
}

const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
    server.close();
  });

  socket.on("data", (data) => {
    const initialPath = data.toString().split(" ")[1];
    const path = initialPath.includes("echo") ? initialPath.split("/")[2] : initialPath;
    const filePath = path.includes("/files") ? initialPath.split("/")[2] : undefined;
    const acceptedPaths = [
      { path: "/echo", dynamic: true },
      { path: "/user-agent", dynamic: false },
      { path: "/", dynamic: false },
      { path: "/files", dynamic: true },
    ];

    const userAgent = initialPath === "/user-agent" ? data.toString().split("User-Agent: ", data.toString().length)[1].trim() : undefined;

    const response = filePath
      ? fileEndPointResponse(filePath).status
      : (id = 0) => {
          if (id >= acceptedPaths.length) return "404 Not Found";
          if (acceptedPaths[id].dynamic ? initialPath.startsWith(acceptedPaths[id].path) : initialPath === acceptedPaths[id].path) {
            return "200 OK";
          }
          return response(id + 1);
        };

    socket.write(
      `HTTP/1.1 ${response}\r\nContent-Type: ${filePath ? "application/octet-stream" : "text/plain"}\r\nContent-Length: ${
        filePath ? fileEndPointResponse(filePath).length : userAgent ? userAgent.length : path.length
      }\r\n\r\n${userAgent || path}`
    );
  });
});

server.on("close", () => {
  return server.listen(4221, "localhost");
});

server.listen(4221, "localhost");
