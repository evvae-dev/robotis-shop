import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { access, mkdir, unlink } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
try { process.loadEnvFile(path.join(root, ".env.local")); } catch (error) { if (error.code !== "ENOENT") throw error; }
const windows = process.platform === "win32";
const version = "4.5.15";
const folder = `blender-${version}-windows-x64`;
const tools = path.join(root, ".tools");
const blender = path.join(tools, folder, "blender.exe");
const python = process.env.PYTHON || (windows ? "python" : "python3");
const venv = path.join(root, ".venv-cad");
const cadPython = process.env.CAD_PYTHON_PATH || path.join(venv, windows ? "Scripts/python.exe" : "bin/python");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit", windowsHide: true, env: { ...process.env, PYTHONUTF8: "1" } });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`${command} 실행 실패 (${code})`)));
  });
}

// 시스템 Python의 패키지를 바꾸지 않고 전용 환경에 CAD 커널을 설치합니다.
if (!process.env.CAD_PYTHON_PATH) await run(python, ["-m", "venv", "--without-pip", venv]);
await run(python, ["-m", "pip", "--python", cadPython, "install", "-r", "scripts/cad/requirements.txt"]);

if (windows && !process.env.BLENDER_PATH) {
  const installed = await access(blender).then(() => true, () => false);
  if (!installed) {
    await mkdir(tools, { recursive: true });
    const filename = `${folder}.zip`;
    const archive = path.join(tools, filename);
    const base = "https://download.blender.org/release/Blender4.5/";
    console.log(`Blender ${version} 공식 배포본 다운로드 중…`);
    const [response, checksums] = await Promise.all([fetch(base + filename), fetch(base + `blender-${version}.sha256`)]);
    if (!response.ok || !checksums.ok || !response.body) throw new Error("Blender 다운로드 실패");
    const checksumText = await checksums.text();
    const expected = checksumText.split(/\r?\n/).find((line) => line.endsWith(filename))?.split(/\s+/)[0];
    if (!expected) throw new Error("Blender 공식 체크섬을 찾을 수 없습니다.");
    const hash = createHash("sha256");
    const stream = Readable.fromWeb(response.body);
    stream.on("data", (chunk) => hash.update(chunk));
    await pipeline(stream, createWriteStream(archive));
    if (hash.digest("hex") !== expected.toLowerCase()) throw new Error("Blender 파일 체크섬 불일치");
    // 경로는 환경변수로 전달해 공백·한글이 있어도 셸 코드로 해석되지 않게 합니다.
    process.env.ROBOTIS_CAD_ARCHIVE = archive;
    process.env.ROBOTIS_CAD_TOOLS = tools;
    await run("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "Expand-Archive -LiteralPath $env:ROBOTIS_CAD_ARCHIVE -DestinationPath $env:ROBOTIS_CAD_TOOLS -Force"]);
    await unlink(archive);
  }
  await run(blender, ["--background", "--factory-startup", "--version"]);
} else {
  await run(process.env.BLENDER_PATH || "blender", ["--background", "--factory-startup", "--version"]);
}
console.log(`CAD 변환 준비 완료. Python: ${cadPython}`);
