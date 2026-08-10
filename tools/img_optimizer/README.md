# Image Optimizer

A small command-line tool that creates optimized image copies while leaving the originals untouched. It supports JPEG, PNG, and WebP output, batch processing, proportional resizing, recursive folders, and dry runs.

## Setup

From the repository root:

```powershell
python -m pip install -r tools/img_optimizer/requirements.txt
```

## Examples

Reproduce the optimization used for the Calcuoke screenshots:

```powershell
python tools/img_optimizer/optimize.py assets/projects/Calcuoke --format jpeg --quality 82
```

Optimize one image while preserving its format:

```powershell
python tools/img_optimizer/optimize.py assets/photo.png
```

Create WebP versions and limit their longest dimensions:

```powershell
python tools/img_optimizer/optimize.py assets --recursive --format webp --quality 80 --max-width 1920 --max-height 1080 --output-dir optimized
```

Preview what would be created:

```powershell
python tools/img_optimizer/optimize.py assets --recursive --format jpeg --dry-run
```

Run `python tools/img_optimizer/optimize.py --help` for every option.

## How it optimizes

- **JPEG:** progressive encoding, optimized Huffman tables, 4:2:0 chroma subsampling, and configurable visual quality. Transparent areas are placed on a configurable background.
- **PNG:** lossless DEFLATE compression with an adjustable compression level.
- **WebP:** Pillow's highest-effort encoding method, with lossy quality control or optional lossless encoding.
- **All formats:** metadata is removed by default, EXIF orientation is applied, and optional resizing uses high-quality Lanczos resampling without upscaling.

Outputs use the `-optimized` suffix by default. Existing output files are skipped unless `--overwrite` is supplied.
