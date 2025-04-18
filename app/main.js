import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { createServer } from "net";

const postFileRequest = async (filename, content) => {
  const p = filename.split("/");
  p.pop();
  const dirPath = p.join("/");

  mkdirSync(p ? process.argv[3] + `/${dirPath}` : "", { recursive: true });

  writeFileSync(`${process.argv[3]}/${filename}`, content);
  return "HTTP/1.1 201 Created\r\n\r\n";
};

const server = createServer((socket) => {
  socket.on("close", () => {
    socket.end();
  });
  socket.on("data", async (data) => {
    const req = data.toString();
    const path = req.split(" ")[1];
    if (path === "/") socket.write("HTTP/1.1 200 OK\r\n\r\n");
    else if (path.startsWith("/files/")) {
      const directory = process.argv[3];
      const filename = path.split("/files/")[1];
      if (req.includes("POST")) {
        req.split("Content-Length: ")[1].split("\r\n")[0];
        const contentLength = parseInt(req.split("Content-Length: ")[1].split("\r\n")[0]);
        const body = req.split("\r\n").slice(-1)[0];

        const res = await postFileRequest(filename, body);
        socket.write(res);
      }
      if (existsSync(`${directory}/${filename}`)) {
        const content = readFileSync(`${directory}/${filename}`).toString();
        const res = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}\r\n`;
        socket.write(res);
      } else {
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      }
    } else if (path === "/user-agent") {
      req.split("\r\n").forEach((line) => {
        if (line.includes("User-Agent")) {
          const res = line.split(" ")[1];
          socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${res.length}\r\n\r\n${res}\r\n`);
        }
      });
    } else if (path.startsWith("/echo/")) {
      const res = path.split("/echo/")[1];
      socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${res.length}\r\n\r\n${res}\r\n\r`);
    } else socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.end();
  });
});
server.listen(4221, "localhost");
