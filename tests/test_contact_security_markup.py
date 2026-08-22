import unittest
from html.parser import HTMLParser
from pathlib import Path


class ContactFormParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_contact_form = False
        self.form_attributes: dict[str, str | None] = {}
        self.fields: dict[str, dict[str, str | None]] = {}
        self.status_attributes: dict[str, str | None] = {}
        self.turnstile_attributes: dict[str, str | None] = {}
        self.submit_attributes: dict[str, str | None] = {}
        self.script_sources: list[str] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        attributes = dict(attrs)
        if tag == "script" and attributes.get("src"):
            self.script_sources.append(attributes["src"] or "")
        if tag == "form" and attributes.get("id") == "contact-form":
            self.in_contact_form = True
            self.form_attributes = attributes
            return
        if not self.in_contact_form:
            return
        if tag in {"input", "textarea"} and attributes.get("name"):
            self.fields[attributes["name"] or ""] = attributes
        if attributes.get("id") == "contact-form-status":
            self.status_attributes = attributes
        if attributes.get("id") == "turnstile-widget":
            self.turnstile_attributes = attributes
        if tag == "button" and attributes.get("type") == "submit":
            self.submit_attributes = attributes

    def handle_endtag(self, tag: str) -> None:
        if tag == "form" and self.in_contact_form:
            self.in_contact_form = False


class ContactSecurityMarkupTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        parser = ContactFormParser()
        index_path = Path(__file__).resolve().parents[1] / "index.html"
        parser.feed(index_path.read_text(encoding="utf-8"))
        cls.form = parser

    def test_form_uses_protected_javascript_submission(self) -> None:
        self.assertEqual(self.form.form_attributes.get("novalidate"), None)
        self.assertNotIn("action", self.form.form_attributes)
        self.assertIn("assets/contact-form.js", self.form.script_sources)
        self.assertTrue(
            any("challenges.cloudflare.com/turnstile" in src for src in self.form.script_sources)
        )

    def test_fields_enforce_the_server_side_limits_in_the_browser(self) -> None:
        expected = {
            "name": {"minlength": "2", "maxlength": "80", "required": None},
            "phone": {"maxlength": "30"},
            "email": {"maxlength": "254", "required": None},
            "message": {"minlength": "20", "maxlength": "3000", "required": None},
        }
        for field_name, attributes in expected.items():
            with self.subTest(field=field_name):
                self.assertIn(field_name, self.form.fields)
                if field_name not in self.form.fields:
                    continue
                for attribute, value in attributes.items():
                    self.assertIn(attribute, self.form.fields[field_name])
                    self.assertEqual(self.form.fields[field_name][attribute], value)

    def test_form_contains_an_inaccessible_honeypot_for_bots(self) -> None:
        self.assertIn("website", self.form.fields)
        if "website" not in self.form.fields:
            return
        honeypot = self.form.fields["website"]
        self.assertEqual(honeypot.get("type"), "text")
        self.assertEqual(honeypot.get("tabindex"), "-1")
        self.assertEqual(honeypot.get("autocomplete"), "off")

    def test_form_announces_status_and_starts_disabled(self) -> None:
        self.assertEqual(self.form.status_attributes.get("role"), "status")
        self.assertEqual(self.form.status_attributes.get("aria-live"), "polite")
        self.assertIn("disabled", self.form.submit_attributes)
        self.assertTrue(self.form.turnstile_attributes)


if __name__ == "__main__":
    unittest.main()
