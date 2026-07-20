#!/usr/bin/env python3

import argparse
import multiprocessing
import os
import queue
import shutil
import subprocess
import tempfile
import threading
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator, NamedTuple, Optional, Sequence


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


class EncodeJob(NamedTuple):
    index: int
    input_file: Path
    output_file: Path
    relative_path: Path
    started_at: float


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Remove PNG backgrounds with birefnet-general and convert the "
            "results to AVIF using a background encoding pipeline."
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
        default=Path("public/images/alpha"),
        help="Destination AVIF directory (default: public/images/alpha)",
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
    parser.add_argument(
        "--heartbeat",
        type=int,
        default=15,
        help="Seconds between progress messages during long operations (default: 15)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=10,
        help=(
            "Files per model process before releasing all process memory "
            "(default: 10)"
        ),
    )
    return parser.parse_args()


def collect_png_files(input_directory: Path) -> list[Path]:
    return sorted(
        path
        for path in input_directory.rglob("*")
        if path.is_file() and path.suffix.lower() == ".png"
    )


def output_path_for(
    input_file: Path,
    input_directory: Path,
    output_directory: Path,
) -> Path:
    relative_path = input_file.relative_to(input_directory)
    return (output_directory / relative_path).with_suffix(".avif")


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


def format_duration(seconds: float) -> str:
    rounded_seconds = max(0, round(seconds))
    hours, remainder = divmod(rounded_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    if hours:
        return f"{hours}h {minutes:02d}m {seconds:02d}s"

    if minutes:
        return f"{minutes}m {seconds:02d}s"

    return f"{seconds}s"


@contextmanager
def heartbeat(label: str, interval_seconds: int) -> Iterator[None]:
    started_at = time.monotonic()
    is_finished = threading.Event()

    def report_progress() -> None:
        while not is_finished.wait(interval_seconds):
            elapsed = format_duration(time.monotonic() - started_at)
            print(f"  still {label} ({elapsed} elapsed)", flush=True)

    thread = threading.Thread(target=report_progress, daemon=True)
    thread.start()

    try:
        yield
    finally:
        is_finished.set()
        thread.join()


def process_files(
    files: Sequence[Path],
    input_directory: Path,
    output_directory: Path,
    overwrite: bool,
    heartbeat_interval: int,
) -> None:
    from PIL import Image
    from rembg import new_session, remove

    pending_files = [
        input_file
        for input_file in files
        if overwrite
        or not output_path_for(input_file, input_directory, output_directory).exists()
    ]
    skipped_count = len(files) - len(pending_files)

    print(
        f"Ready: {len(pending_files)} file(s) pending, "
        f"{skipped_count} already completed",
        flush=True,
    )

    if not pending_files:
        return

    print("Loading birefnet-general model...", flush=True)
    with heartbeat("loading model", heartbeat_interval):
        session = new_session(
            "birefnet-general",
            providers=["CPUExecutionProvider"],
        )
    print("Model loaded", flush=True)

    batch_started_at = time.monotonic()

    with tempfile.TemporaryDirectory(prefix="rembg-alpha-") as temporary_directory:
        temporary_path = Path(temporary_directory)
        encode_queue: queue.Queue[Optional[EncodeJob]] = queue.Queue(maxsize=1)
        encode_errors: list[Exception] = []

        def encode_worker() -> None:
            while True:
                job = encode_queue.get()

                try:
                    if job is None:
                        return

                    if encode_errors:
                        continue

                    print(
                        f"[{job.index}/{len(pending_files)}] encoding AVIF: "
                        f"{job.relative_path}",
                        flush=True,
                    )
                    encode_avif(job.input_file, job.output_file)

                    elapsed = time.monotonic() - batch_started_at
                    average = elapsed / job.index
                    remaining = average * (len(pending_files) - job.index)
                    file_elapsed = time.monotonic() - job.started_at
                    print(
                        f"[{job.index}/{len(pending_files)}] done in "
                        f"{format_duration(file_elapsed)}; average "
                        f"{format_duration(average)}; "
                        f"ETA {format_duration(remaining)}",
                        flush=True,
                    )
                except Exception as error:
                    encode_errors.append(error)
                finally:
                    if job is not None:
                        job.input_file.unlink(missing_ok=True)
                    encode_queue.task_done()

        worker = threading.Thread(
            target=encode_worker,
            name="avif-encoder",
            daemon=True,
        )
        worker.start()

        try:
            for index, input_file in enumerate(pending_files, start=1):
                if encode_errors:
                    raise encode_errors[0]

                relative_path = input_file.relative_to(input_directory)
                output_file = output_path_for(
                    input_file,
                    input_directory,
                    output_directory,
                )
                output_file.parent.mkdir(parents=True, exist_ok=True)
                temporary_png = temporary_path / f"frame-{index}.png"
                file_started_at = time.monotonic()

                print(
                    f"[{index}/{len(pending_files)}] removing background: "
                    f"{relative_path}",
                    flush=True,
                )

                with heartbeat("removing background", heartbeat_interval):
                    with Image.open(input_file) as image:
                        remove(image, session=session).save(
                            temporary_png,
                            format="PNG",
                        )

                encode_queue.put(
                    EncodeJob(
                        index=index,
                        input_file=temporary_png,
                        output_file=output_file,
                        relative_path=relative_path,
                        started_at=file_started_at,
                    ),
                )
        finally:
            encode_queue.put(None)
            worker.join()

        if encode_errors:
            raise encode_errors[0]

    total_elapsed = format_duration(time.monotonic() - batch_started_at)
    print(f"Completed {len(pending_files)} file(s) in {total_elapsed}", flush=True)


def process_in_batches(
    files: Sequence[Path],
    input_directory: Path,
    output_directory: Path,
    overwrite: bool,
    heartbeat_interval: int,
    batch_size: int,
) -> None:
    pending_files = [
        input_file
        for input_file in files
        if overwrite
        or not output_path_for(input_file, input_directory, output_directory).exists()
    ]
    skipped_count = len(files) - len(pending_files)

    print(
        f"Ready: {len(pending_files)} file(s) pending, "
        f"{skipped_count} already completed",
        flush=True,
    )

    if not pending_files:
        return

    batches = [
        pending_files[index : index + batch_size]
        for index in range(0, len(pending_files), batch_size)
    ]
    process_context = multiprocessing.get_context("spawn")

    for batch_index, batch_files in enumerate(batches, start=1):
        print(
            f"Starting batch {batch_index}/{len(batches)} "
            f"({len(batch_files)} file(s))",
            flush=True,
        )
        process = process_context.Process(
            target=process_files,
            kwargs={
                "files": batch_files,
                "input_directory": input_directory,
                "output_directory": output_directory,
                "overwrite": overwrite,
                "heartbeat_interval": heartbeat_interval,
            },
            name=f"background-removal-batch-{batch_index}",
        )
        process.start()

        try:
            process.join()
        except BaseException:
            if process.is_alive():
                process.terminate()
                process.join()
            raise

        if process.exitcode != 0:
            raise RuntimeError(
                f"Batch {batch_index}/{len(batches)} failed with "
                f"exit code {process.exitcode}",
            )

        print(
            f"Finished batch {batch_index}/{len(batches)}; "
            "model process memory released",
            flush=True,
        )


def main() -> None:
    args = parse_args()

    if args.threads < 1:
        raise ValueError("--threads must be at least 1")

    if args.heartbeat < 1:
        raise ValueError("--heartbeat must be at least 1")

    if args.batch_size < 1:
        raise ValueError("--batch-size must be at least 1")

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
        f"Processing {len(files)} PNG file(s) in batches of {args.batch_size} "
        f"with birefnet-general and {args.threads} CPU thread(s)",
        flush=True,
    )
    process_in_batches(
        files=files,
        input_directory=input_directory,
        output_directory=output_directory,
        overwrite=args.overwrite,
        heartbeat_interval=args.heartbeat,
        batch_size=args.batch_size,
    )


if __name__ == "__main__":
    main()
