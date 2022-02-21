import { transformFile } from "@swc/core";
import { join, relative, dirname } from "path";
import { execSync } from "child_process";
import fs from "fs/promises";
import { plugin } from "swc-plugin-purescript-esm";

execSync("spago build", { uid: process.getuid() });

const inputDir = join(
    process.cwd(),
    execSync("npx spago path output").toString().trim()
);
const outDir = "output_esm";

async function transpileDir(inDir, outDir) {
    const all = await fs.readdir(inDir);
    all.slice(0, 2);
    const files = await Promise.all(
        all.map(async (root) => {
            const fullPath = join(inDir, root);
            const stats = await fs.stat(fullPath);
            if (!stats.isDirectory()) {
                return [];
            }
            return fs
                .readdir(fullPath)
                .then((files) => files.map((f) => join(fullPath, f)))
                .then((files) => files.filter((file) => file.endsWith(".js")));
        })
    );
    await Promise.all(
        files.flat().map(async (file) => {
            const outFile = join(outDir, relative(inDir, file));
            const { code } = await transformFile(file, { plugin: plugin() });
            await fs.mkdir(dirname(outFile), { recursive: true });
            return fs.writeFile(outFile, code);
        })
    );
}

transpileDir(inputDir, outDir);
