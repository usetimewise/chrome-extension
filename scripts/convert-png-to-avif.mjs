import { spawnSync } from "node:child_process";
import { mkdir, readdir, rename } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

const AVIFENC_ARGS = [
    "--yuv",
    "444",
    "--qcolor",
    "85",
    "--qalpha",
    "100",
    "--speed",
    "4",
    "--jobs",
    "all",
];

const DEFAULT_INPUT_DIR = "images";

function parseArgs(argv) {
    const options = {
        archiveDir: null,
        inputDir: DEFAULT_INPUT_DIR,
        outputDir: null,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        const next = argv[index + 1];

        if (arg === "--archive-png") {
            if (!next) {
                throw new Error("--archive-png requires a directory path");
            }
            options.archiveDir = next;
            index += 1;
            continue;
        }

        if (arg === "--input") {
            if (!next) {
                throw new Error("--input requires a directory path");
            }
            options.inputDir = next;
            index += 1;
            continue;
        }

        if (arg === "--output") {
            if (!next) {
                throw new Error("--output requires a directory path");
            }
            options.outputDir = next;
            index += 1;
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    return options;
}

async function collectPngFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const path = join(directory, entry.name);

        if (entry.isDirectory()) {
            files.push(...(await collectPngFiles(path)));
            continue;
        }

        if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
            files.push(path);
        }
    }

    return files;
}

function outputPathFor(file, options) {
    const avifName = file.replace(/\.png$/i, ".avif");

    if (!options.outputDir) {
        return avifName;
    }

    return join(options.outputDir, relative(options.inputDir, avifName));
}

function archivePathFor(file, options) {
    return join(options.archiveDir, relative(options.inputDir, file));
}

function encodeAvif(inputFile, outputFile) {
    const result = spawnSync(
        "avifenc",
        [...AVIFENC_ARGS, inputFile, outputFile],
        {
            stdio: "inherit",
        },
    );

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(`avifenc failed for ${inputFile}`);
    }
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const pngFiles = await collectPngFiles(options.inputDir);

    if (pngFiles.length === 0) {
        console.log(`No PNG files found in ${options.inputDir}`);
        return;
    }

    console.log(
        `Converting ${pngFiles.length} PNG file(s) with avifenc ${AVIFENC_ARGS.join(" ")}`,
    );

    for (const file of pngFiles) {
        const outputFile = outputPathFor(file, options);
        await mkdir(dirname(outputFile), { recursive: true });
        encodeAvif(file, outputFile);

        if (options.archiveDir) {
            const archiveFile = archivePathFor(file, options);
            await mkdir(dirname(archiveFile), { recursive: true });
            await rename(file, archiveFile);
        }
    }

    if (options.archiveDir) {
        console.log(`Converted and archived PNG files to ${options.archiveDir}`);
        return;
    }

    console.log("Converted PNG files to AVIF");
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
