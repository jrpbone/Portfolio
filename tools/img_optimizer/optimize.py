#!/usr/bin/env python3
"""Optimize raster images from the command line without modifying the originals."""

from __future__ import annotations

import argparse
import os
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable, TextIO

from PIL import Image, ImageColor, ImageOps


SUPPORTED_INPUTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
OUTPUT_EXTENSIONS = {"jpeg": ".jpg", "png": ".png", "webp": ".webp"}


@dataclass(frozen=True)
class Job:
    source: Path
    target: Path
    output_format: str


def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("must be greater than zero")
    return parsed


def quality_value(value: str) -> int:
    parsed = int(value)
    if not 1 <= parsed <= 100:
        raise argparse.ArgumentTypeError("must be between 1 and 100")
    return parsed


def compression_level(value: str) -> int:
    parsed = int(value)
    if not 0 <= parsed <= 9:
        raise argparse.ArgumentTypeError("must be between 0 and 9")
    return parsed


def prompt_value(
    label: str,
    input_fn: Callable[[str], str],
    output: TextIO,
    *,
    default: str | None = None,
    allow_empty: bool = False,
    validator: Callable[[str], str] | None = None,
) -> str:
    default_hint = f" [{default}]" if default is not None else ""
    while True:
        value = input_fn(f"{label}{default_hint}: ").strip()
        if not value and default is not None:
            value = default
        if not value and allow_empty:
            return ""
        if not value and not allow_empty:
            print("A value is required.", file=output)
            continue
        try:
            return validator(value) if validator is not None else value
        except (ValueError, argparse.ArgumentTypeError) as error:
            print(f"Invalid value: {error}", file=output)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Create smaller JPEG, PNG, or WebP copies of raster images.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("inputs", nargs="+", type=Path, help="Image files or directories")
    parser.add_argument(
        "-f",
        "--format",
        choices=("auto", "jpeg", "png", "webp"),
        default="auto",
        help="Output format; auto preserves JPEG, PNG, and WebP inputs",
    )
    parser.add_argument("-q", "--quality", type=quality_value, default=82, help="JPEG/WebP quality")
    parser.add_argument("--png-level", type=compression_level, default=9, help="PNG compression level")
    parser.add_argument("--lossless-webp", action="store_true", help="Encode WebP losslessly")
    parser.add_argument("--max-width", type=positive_int, help="Maximum output width")
    parser.add_argument("--max-height", type=positive_int, help="Maximum output height")
    parser.add_argument("--background", default="#ffffff", help="Matte color when JPEG removes transparency")
    parser.add_argument("--suffix", default="-optimized", help="Text appended to output filenames")
    parser.add_argument("-o", "--output-dir", type=Path, help="Place results under this directory")
    parser.add_argument("-r", "--recursive", action="store_true", help="Search input directories recursively")
    parser.add_argument("--keep-metadata", action="store_true", help="Keep EXIF and ICC profile data")
    parser.add_argument("--overwrite", action="store_true", help="Replace an existing output file")
    parser.add_argument("--dry-run", action="store_true", help="Show planned outputs without writing files")
    return parser


def normalized_format(source: Path, requested: str) -> str:
    if requested != "auto":
        return requested
    if source.suffix.lower() in {".jpg", ".jpeg"}:
        return "jpeg"
    if source.suffix.lower() in {".png", ".webp"}:
        return source.suffix.lower()[1:]
    raise ValueError(f"{source}: choose --format for {source.suffix or 'this file type'}")


def files_in(path: Path, recursive: bool) -> Iterable[tuple[Path, Path]]:
    """Yield (file, relative-path) pairs for a file or directory input."""
    if path.is_file():
        yield path, Path(path.name)
        return
    if not path.is_dir():
        raise FileNotFoundError(f"input does not exist: {path}")

    iterator = path.rglob("*") if recursive else path.glob("*")
    for candidate in sorted(iterator):
        if candidate.is_file() and candidate.suffix.lower() in SUPPORTED_INPUTS:
            yield candidate, candidate.relative_to(path)


def create_jobs(args: argparse.Namespace) -> list[Job]:
    jobs: list[Job] = []
    targets: set[Path] = set()

    for input_path in args.inputs:
        input_path = input_path.expanduser()
        for source, relative in files_in(input_path, args.recursive):
            if args.suffix and source.stem.endswith(args.suffix):
                continue
            output_format = normalized_format(source, args.format)
            output_name = f"{relative.stem}{args.suffix}{OUTPUT_EXTENSIONS[output_format]}"
            if args.output_dir:
                target = args.output_dir.expanduser() / relative.parent / output_name
            else:
                target = source.parent / output_name
            source_resolved = source.resolve()
            target_resolved = target.resolve()
            if source_resolved == target_resolved and not args.overwrite:
                raise ValueError(f"refusing to replace input without --overwrite: {source}")
            if target_resolved in targets:
                raise ValueError(f"multiple inputs would create the same file: {target}")
            targets.add(target_resolved)
            jobs.append(Job(source, target, output_format))
    return jobs


def resized(image: Image.Image, max_width: int | None, max_height: int | None) -> Image.Image:
    width_limit = max_width or image.width
    height_limit = max_height or image.height
    scale = min(width_limit / image.width, height_limit / image.height, 1.0)
    if scale >= 1.0:
        return image
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    return image.resize(size, Image.Resampling.LANCZOS)


def jpeg_image(image: Image.Image, background: str) -> Image.Image:
    if image.mode in {"RGBA", "LA"} or "transparency" in image.info:
        rgba = image.convert("RGBA")
        matte = Image.new("RGBA", rgba.size, ImageColor.getrgb(background) + (255,))
        return Image.alpha_composite(matte, rgba).convert("RGB")
    return image.convert("RGB")


def metadata_for(image: Image.Image, keep: bool) -> dict[str, object]:
    if not keep:
        return {}
    metadata: dict[str, object] = {}
    if image.info.get("exif"):
        metadata["exif"] = image.info["exif"]
    if image.info.get("icc_profile"):
        metadata["icc_profile"] = image.info["icc_profile"]
    return metadata


def save_job(job: Job, args: argparse.Namespace) -> tuple[int, int, tuple[int, int]]:
    before = job.source.stat().st_size
    job.target.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(job.source) as opened:
        metadata = metadata_for(opened, args.keep_metadata)
        image = resized(ImageOps.exif_transpose(opened), args.max_width, args.max_height)

        save_options: dict[str, object] = metadata
        if job.output_format == "jpeg":
            image = jpeg_image(image, args.background)
            save_options.update(
                quality=args.quality,
                optimize=True,
                progressive=True,
                subsampling="4:2:0",
            )
        elif job.output_format == "png":
            save_options.update(optimize=True, compress_level=args.png_level)
        else:
            save_options.update(
                quality=args.quality,
                lossless=args.lossless_webp,
                method=6,
            )

        suffix = OUTPUT_EXTENSIONS[job.output_format]
        temp_path: Path | None = None
        try:
            with tempfile.NamedTemporaryFile(
                prefix=f".{job.target.stem}-",
                suffix=suffix,
                dir=job.target.parent,
                delete=False,
            ) as temporary:
                temp_path = Path(temporary.name)
            image.save(temp_path, format=job.output_format.upper(), **save_options)
            os.replace(temp_path, job.target)
            temp_path = None
        finally:
            if temp_path is not None:
                temp_path.unlink(missing_ok=True)

        size = image.size

    return before, job.target.stat().st_size, size


def human_size(size: int) -> str:
    value = float(size)
    for unit in ("B", "KB", "MB", "GB"):
        if value < 1024 or unit == "GB":
            return f"{value:.0f} {unit}" if unit == "B" else f"{value:.1f} {unit}"
        value /= 1024
    raise AssertionError("unreachable")


def size_change(before: int, after: int) -> str:
    if before == 0:
        return "size unavailable"
    change = abs(1 - after / before) * 100
    direction = "smaller" if after <= before else "larger"
    return f"{change:.1f}% {direction}"


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        ImageColor.getrgb(args.background)
        jobs = create_jobs(args)
    except (FileNotFoundError, ValueError) as error:
        parser.error(str(error))

    if not jobs:
        print("No supported input images found.")
        return 0

    completed = skipped = failed = 0
    total_before = total_after = 0
    for job in jobs:
        if job.target.exists() and not args.overwrite:
            print(f"SKIP  {job.target} (already exists)")
            skipped += 1
            continue
        if args.dry_run:
            print(f"PLAN  {job.source} -> {job.target}")
            continue
        try:
            before, after, size = save_job(job, args)
            print(
                f"OK    {job.source} -> {job.target} "
                f"[{size[0]}x{size[1]}, {human_size(before)} -> {human_size(after)}, "
                f"{size_change(before, after)}]"
            )
            completed += 1
            total_before += before
            total_after += after
        except Exception as error:  # Continue processing independent images.
            print(f"ERROR {job.source}: {error}", file=sys.stderr)
            failed += 1

    if args.dry_run:
        print(f"Planned {len(jobs)} image(s).")
    else:
        summary = f"Optimized {completed}, skipped {skipped}, failed {failed}."
        if completed:
            summary += (
                f" Total: {human_size(total_before)} -> {human_size(total_after)} "
                f"({size_change(total_before, total_after)})."
            )
        print(summary)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
