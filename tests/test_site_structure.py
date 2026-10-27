import json
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class SiteParser(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.elements = []
        self.navigation = {'Primary navigation': [], 'Footer navigation': []}
        self.scope = None
        self.title = ''
        self.in_title = False
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if tag == 'nav':
            self.scope = attrs.get('aria-label')
        if tag == 'a' and self.scope in self.navigation:
            self.navigation[self.scope].append(attrs)
        if tag == 'title':
            self.in_title = True

    def handle_endtag(self, tag):
        if tag == 'nav':
            self.scope = None
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


class SiteStructureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.registry = json.loads((ROOT / 'works/projects.json').read_text(encoding='utf-8'))
        cls.paths = ['index.html', 'works/index.html', 'about/index.html', 'contact/index.html']
        cls.paths += [f"works/{p['slug']}/index.html" for p in cls.registry]
        cls.paths += ['works/_template/index.html']

    def test_every_page_has_the_shared_navigation_and_footer(self):
        for path in self.paths:
            with self.subTest(path=path):
                html = (ROOT / path).read_text(encoding='utf-8')
                page = SiteParser(html)
                primary = page.navigation['Primary navigation']
                self.assertEqual([a['href'] for a in primary], ['/', '/works/', '/about/', '/contact/'])
                active = [a['href'] for a in primary if a.get('aria-current') == 'page']
                expected = '/' if path == 'index.html' else '/about/' if path.startswith('about/') else '/contact/' if path.startswith('contact/') else '/works/'
                self.assertEqual(active, [expected])
                self.assertEqual([a['href'] for a in page.navigation['Footer navigation']],
                                 ['https://github.com/jrpbone', 'https://www.linkedin.com/in/jrpbone', 'mailto:johnralphbone@gmail.com'])
                self.assertEqual(sum(tag == 'h1' for tag, _ in page.elements), 1)
                self.assertTrue(any(tag == 'a' and attrs.get('href') == '#main-content' for tag, attrs in page.elements))

    def test_primary_pages_have_unique_search_metadata(self):
        titles, descriptions, canonical = set(), set(), set()
        for path in self.paths[:-1]:
            page = SiteParser((ROOT / path).read_text(encoding='utf-8'))
            self.assertNotIn(page.title.strip(), titles)
            titles.add(page.title.strip())
            description = next(attrs['content'] for tag, attrs in page.elements if tag == 'meta' and attrs.get('name') == 'description')
            self.assertNotIn(description, descriptions)
            descriptions.add(description)
            url = next(attrs['href'] for tag, attrs in page.elements if tag == 'link' and attrs.get('rel') == 'canonical')
            self.assertNotIn(url, canonical)
            canonical.add(url)
            for prop in ['og:title', 'og:description', 'og:url', 'og:image']:
                self.assertTrue(any(tag == 'meta' and attrs.get('property') == prop and attrs.get('content') for tag, attrs in page.elements))

    def test_home_is_short_and_the_contact_form_has_moved(self):
        home = (ROOT / 'index.html').read_text(encoding='utf-8')
        page = SiteParser(home)
        sections = [a['id'] for tag, a in page.elements if tag == 'section' and 'id' in a]
        self.assertEqual(sections, ['home', 'featured-work', 'services', 'experience', 'contact'])
        self.assertNotIn('id="contact-form"', home)
        self.assertNotIn('class="about-stack"', home)
        self.assertIn('<!-- TODO(J.R.): add testimonials or certifications -->', home)
        self.assertIn('id="contact-form"', (ROOT / 'contact/index.html').read_text(encoding='utf-8'))

    def test_project_order_and_captioned_gallery(self):
        for path in [f"works/{p['slug']}/index.html" for p in self.registry] + ['works/_template/index.html']:
            with self.subTest(path=path):
                html = (ROOT / path).read_text(encoding='utf-8')
                page = SiteParser(html)
                sections = [a.get('id') for tag, a in page.elements if tag == 'section' and a.get('id')]
                self.assertEqual(sections, ['problem', 'contribution', 'how-it-works', 'result', 'gallery', 'next-steps'])
                facts = [i for i, (tag, a) in enumerate(page.elements) if a.get('class') == 'project-facts']
                cover = next(i for i, (tag, a) in enumerate(page.elements) if a.get('class') == 'project-cover container')
                self.assertLess(facts[0], cover)
                gallery = html.split('class="project-gallery"', 1)[1].split('</section>', 1)[0]
                if '<img' in gallery:
                    self.assertTrue(any(tag == 'figcaption' for tag, _ in page.elements))

    def test_new_pages_are_in_the_sitemap(self):
        sitemap = (ROOT / 'sitemap.xml').read_text(encoding='utf-8')
        for path in ['/', '/works/', '/about/', '/contact/']:
            self.assertIn('https://jrpbone.vercel.app' + path + '</loc>', sitemap)


if __name__ == '__main__':
    unittest.main()
