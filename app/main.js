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
  let req = "";
  socket.on("data", async (data) => {
    req += data.toString();

    while (true) {
      const endOfHeaders = req.indexOf("\r\n\r\n");

      if (endOfHeaders === -1) {
        // Incomplete request, wait for more data
        break;
      }

      const rawRequest = req.substring(0, endOfHeaders + 4); // Include the \r\n\r\n
      const remainingData = req.substring(endOfHeaders + 4);

      const rawLines = rawRequest.split("\r\n");
      const firstLine = rawLines[0];
      const headers = rawLines.slice(1, -2).reduce((acc, line) => {
        // Exclude the last empty line before \r\n\r\n
        const [key, value] = line.split(": ");
        if (key && value) acc[key] = value;
        return acc;
      }, {});
      const path = firstLine?.split(" ")[1];
      const body = rawRequest.split("\r\n\r\n")[1] || ""; // Extract body after headers

      if (path === "/") {
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
      } else if (path.startsWith("/files/")) {
        const directory = process.argv[3];
        const filename = path.split("/files/")[1];
        if (rawRequest.includes("POST")) {
          await postFileRequest(filename, body);
          socket.write("HTTP/1.1 201 Created\r\n\r\n");
        } else if (existsSync(`${directory}/${filename}`)) {
          const content = readFileSync(`${directory}/${filename}`).toString();
          socket.write(`HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}\r\n`);
        } else {
          socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        }
      } else if (path === "/user-agent") {
        if (headers["User-Agent"]) {
          const res = headers["User-Agent"];
          socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${res.length}\r\n\r\n${res}\r\n`);
        }
      } else if (path.startsWith("/echo/")) {
        let echoBody = path.split("/echo/")[1] || body;
        const contentEncoding = getAcceptContent(rawRequest); // Use the rawRequest for headers

        if (contentEncoding) {
          const content = gzipSync(echoBody);
          const data = new Buffer.from(content);
          const encodedBody = contentEncoding.includes("gzip") ? data : Buffer.from(echoBody);

          socket.write(
            `HTTP/1.1 200 OK\r\n${
              contentEncoding ? "Content-Encoding: " + contentEncoding + "\r\n" : ""
            }Content-Type: text/plain\r\nContent-Length: ${encodedBody.length}\r\n\r\n`
          );
          socket.write(encodedBody);
        } else {
          socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${echoBody.length}\r\n\r\n${echoBody}\r\n`);
        }
      } else {
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      }

      if (headers["Connection"] && headers["Connection"].toLowerCase() === "close") {
        socket.end();
        break; // Exit the while loop as the connection will be closed
      }

      // Update the 'req' buffer to contain any remaining data
      req = remainingData;

      // Continue the loop to process any subsequent complete requests in the buffer
    }
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
    socket.end();
    server.close();
  });
});

server.listen(4221, "localhost");
