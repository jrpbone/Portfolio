from io import StringIO
import tempfile
import unittest
from pathlib import Path

from PIL import Image

import optimize


class OptimizerTests(unittest.TestCase):
    def test_prompt_value_uses_default_for_empty_answer(self) -> None:
        value = optimize.prompt_value(
            "Format", lambda _: "", StringIO(), default="auto"
        )
        self.assertEqual(value, "auto")

    def test_prompt_value_retries_after_invalid_answer(self) -> None:
        answers = iter(["wrong", "png"])
        output = StringIO()

        def validate(value: str) -> str:
            if value not in {"auto", "jpeg", "png", "webp"}:
                raise ValueError("choose auto, jpeg, png, or webp")
            return value

        value = optimize.prompt_value(
            "Format", lambda _: next(answers), output, validator=validate
        )
        self.assertEqual(value, "png")
        self.assertIn("choose auto, jpeg, png, or webp", output.getvalue())

    def test_jpeg_conversion_flattens_transparency_and_resizes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "sample.png"
            Image.new("RGBA", (200, 100), (255, 0, 0, 128)).save(source)

            result = optimize.main(
                [str(source), "--format", "jpeg", "--max-width", "100"]
            )

            target = root / "sample-optimized.jpg"
            self.assertEqual(result, 0)
            self.assertTrue(target.exists())
            with Image.open(target) as output:
                self.assertEqual(output.format, "JPEG")
                self.assertEqual(output.mode, "RGB")
                self.assertEqual(output.size, (100, 50))

    def test_existing_output_is_not_replaced_without_overwrite(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "sample.png"
            target = root / "sample-optimized.png"
            Image.new("RGB", (10, 10), "red").save(source)
            target.write_bytes(b"leave me alone")

            result = optimize.main([str(source)])

            self.assertEqual(result, 0)
            self.assertEqual(target.read_bytes(), b"leave me alone")

    def test_dry_run_does_not_write_output(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "sample.png"
            Image.new("RGB", (10, 10), "blue").save(source)

            result = optimize.main([str(source), "--dry-run"])

            self.assertEqual(result, 0)
            self.assertFalse((root / "sample-optimized.png").exists())

    def test_size_change_reports_both_directions(self) -> None:
        self.assertEqual(optimize.size_change(100, 75), "25.0% smaller")
        self.assertEqual(optimize.size_change(100, 125), "25.0% larger")


if __name__ == "__main__":
    unittest.main()
