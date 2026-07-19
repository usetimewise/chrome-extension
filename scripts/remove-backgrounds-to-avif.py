#!/usr/bin/env python3

import argparse
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Sequence


AVIFENC_ARGS = (
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
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Remove PNG backgrounds with birefnet-general and convert the "
            "results to AVIF sequentially."
        ),
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("logs/raw-images"),
        help="Source PNG directory (default: logs/raw-images)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("images/alpha"),
        help="Destination AVIF directory (default: images/alpha)",
    )
    parser.add_argument(
        "--threads",
        type=int,
        default=2,
        help="ONNX Runtime CPU thread limit (default: 2)",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Reprocess AVIF files that already exist",
    )
    return parser.parse_args()


def collect_png_files(input_directory: Path) -> list[Path]:
    return sorted(
        path
        for path in input_directory.rglob("*")
        if path.is_file() and path.suffix.lower() == ".png"
    )


def encode_avif(input_file: Path, output_file: Path) -> None:
    temporary_output = output_file.with_name(f"{output_file.stem}.tmp.avif")

    try:
        subprocess.run(
            ("avifenc", *AVIFENC_ARGS, str(input_file), str(temporary_output)),
            check=True,
        )
        temporary_output.replace(output_file)
    finally:
        temporary_output.unlink(missing_ok=True)


def process_files(
    files: Sequence[Path],
    input_directory: Path,
    output_directory: Path,
    overwrite: bool,
) -> None:
    from PIL import Image
    from rembg import new_session, remove

    session = new_session(
        "birefnet-general",
        providers=["CPUExecutionProvider"],
    )

    with tempfile.TemporaryDirectory(prefix="rembg-alpha-") as temporary_directory:
        temporary_png = Path(temporary_directory) / "frame.png"

        for index, input_file in enumerate(files, start=1):
            relative_path = input_file.relative_to(input_directory)
            output_file = (output_directory / relative_path).with_suffix(".avif")

            if output_file.exists() and not overwrite:
                print(f"[{index}/{len(files)}] skip {relative_path}", flush=True)
                continue

            output_file.parent.mkdir(parents=True, exist_ok=True)

            with Image.open(input_file) as image:
                remove(image, session=session).save(temporary_png, format="PNG")

            encode_avif(temporary_png, output_file)
            temporary_png.unlink(missing_ok=True)
            print(f"[{index}/{len(files)}] done {relative_path}", flush=True)


def main() -> None:
    args = parse_args()

    if args.threads < 1:
        raise ValueError("--threads must be at least 1")

    input_directory = args.input.resolve()
    output_directory = args.output.resolve()

    if not input_directory.is_dir():
        raise FileNotFoundError(f"Input directory does not exist: {input_directory}")

    if shutil.which("avifenc") is None:
        raise RuntimeError(
            "avifenc is not installed. On macOS, install it with: brew install libavif",
        )

    files = collect_png_files(input_directory)

    if not files:
        print(f"No PNG files found in {input_directory}")
        return

    os.environ["OMP_NUM_THREADS"] = str(args.threads)
    print(
        f"Processing {len(files)} PNG file(s) sequentially with "
        f"birefnet-general and {args.threads} CPU thread(s)",
        flush=True,
    )
    process_files(
        files=files,
        input_directory=input_directory,
        output_directory=output_directory,
        overwrite=args.overwrite,
    )


if __name__ == "__main__":
    main()
