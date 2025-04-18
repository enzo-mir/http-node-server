import fs, { mkdirSync } from "node:fs";

export const postFileRequest = async (filename, content) => {
  const p = filename.split("/");
  p.pop();
  const dirPath = p.join("/");

  mkdirSync(p ? `tmp/${dirPath}` : "tmp", { recursive: true });

  fs.writeFileSync(`tmp/${filename}`, content);
  return "HTTP/1.1 201 Created\r\n\r\n";
};
