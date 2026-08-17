import unittest
from html.parser import HTMLParser
from pathlib import Path


class GalleryParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.current_project: str | None = None
        self.pending_sources: list[str] | None = None
        self.galleries: dict[str, tuple[list[str], str]] = {}

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        attributes = dict(attrs)
        if tag == "article" and attributes.get("data-project"):
            self.current_project = attributes["data-project"]
        if (
            tag == "div"
            and self.current_project
            and "work-image" in (attributes.get("class") or "").split()
            and attributes.get("data-gallery")
        ):
            self.pending_sources = attributes["data-gallery"].split("|")
        if tag == "img" and self.current_project and self.pending_sources:
            self.galleries[self.current_project] = (
                self.pending_sources,
                attributes.get("src") or "",
            )
            self.pending_sources = None

    def handle_endtag(self, tag: str) -> None:
        if tag == "article":
            self.current_project = None
            self.pending_sources = None


class ProjectGalleryTests(unittest.TestCase):
    def test_initial_image_is_first_gallery_source(self) -> None:
        parser = GalleryParser()
        index_path = Path(__file__).resolve().parents[1] / "index.html"
        parser.feed(index_path.read_text(encoding="utf-8"))

        self.assertIn("lnpulse", parser.galleries)
        for project, (sources, initial_source) in parser.galleries.items():
            with self.subTest(project=project):
                self.assertEqual(sources[0], initial_source)


if __name__ == "__main__":
    unittest.main()
