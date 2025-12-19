import fs from "fs";
import path from "path";
import { spawn } from "child_process";

export async function generateVideoThumbnail({ videoPath, thumbsDir, fileId }) {
    fs.mkdirSync(thumbsDir, { recursive: true });

    const outName = `${fileId}.jpg`;
    const outPath = path.join(thumbsDir, outName);

    const args = [
        "-y",
        "-ss", "1",
        "-i", videoPath,
        "-vf", "scale=480:-1",
        "-frames:v", "1",
        outPath,
    ];

    await new Promise((resolve, reject) => {
        const p = spawn("ffmpeg", args, { stdio: "ignore" });
        p.on("error", reject);
        p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`))));
    });

    return outPath;
}