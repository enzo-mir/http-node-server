import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { createServer } from "net";
import { gzipSync } from "zlib";

const getBody = (req) => {
  const body = req.split("\r\n").slice(-1)[0];
  return body;
};

const postFileRequest = async (filename, content) => {
  const p = filename.split("/");
  p.pop();
  const dirPath = p.join("/");

  mkdirSync(p ? process.argv[3] + `/${dirPath}` : "", { recursive: true });

  writeFileSync(`${process.argv[3]}/${filename}`, content);

  return "HTTP/1.1 201 Created\r\n\r\n";
};

const getAcceptContent = (req) => {
  const acceptContent = req
    .split("\r\n")
    .find((line) => line.includes("Accept-Encoding:"))
    ?.split(": ")[1];

  if (acceptContent?.includes(",")) {
    const content = acceptContent.split(",");
    const validContent = content.filter((c) => !c.includes("encoding"));

    return validContent.join(", ");
  } else if (acceptContent?.includes("encoding")) return undefined;

  return acceptContent;
};

const server = createServer((socket) => {
  socket.on("data", async (data) => {
    const req = data.toString();
    while (req.includes("\r\n\r\n")) {
      const raw = req.split("\r\n\r\n")[0];
      const headers = raw.split("\r\n").reduce((acc, line) => {
        const [key, value] = line.split(": ");
        if (key && value) acc[key] = value;
        return acc;
      }, {});
      const path = req.split(" ")[1];
      if (path === "/") {
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
      } else if (path.startsWith("/files/")) {
        const directory = process.argv[3];
        const filename = path.split("/files/")[1];
        let res;
        if (req.includes("POST")) {
          const content = getBody(req);
          res = await postFileRequest(filename, content);
        }
        if (existsSync(`${directory}/${filename}`)) {
          const content = readFileSync(`${directory}/${filename}`).toString();
          const res = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}\r\n`;
          socket.write(res);
        } else {
          socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        }
      } else if (path === "/user-agent") {
        if (headers["User-Agent"]) {
          const res = headers["User-Agent"].split(" ")[1];
          socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${res.length}\r\n\r\n${res}\r\n`);
        }
      } else if (path.startsWith("/echo/")) {
        let body = path.split("/echo/")[1];
        const contentEncoding = getAcceptContent(req);

        if (contentEncoding) {
          const content = gzipSync(body);
          const data = new Buffer.from(content);
          body = contentEncoding.includes("gzip") ? data : body;

          socket.write(
            `HTTP/1.1 200 OK\r\n${contentEncoding ? "Content-Encoding: " + contentEncoding : ""}\r\nContent-Type: text/plain\r\nContent-Length: ${
              body.length
            }\r\n\r\n`
          );
          socket.write(data);
        }

        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${body.length}\r\n\r\n${body}\r\n\r`);
      } else {
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      }

      if (headers["Connection"] && headers["Connection"].toLowerCase() === "close") {
        socket.end();
      }
    }
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
    socket.end();
    server.close();
  });
});

server.listen(4221, "localhost");
