import json
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class PageParser(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.nodes = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag, dict(attrs)))

    def matching(self, tag=None, classname=None):
        return [attrs for node, attrs in self.nodes if (tag is None or node == tag)
                and (classname is None or classname in attrs.get('class', '').split())]


class ProjectPagesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.projects = json.loads((ROOT / 'works/projects.json').read_text(encoding='utf-8'))
        cls.published = [p for p in cls.projects if p.get('published', True)]

    def test_registry_assets_pages_and_cards(self):
        index = PageParser((ROOT / 'works/index.html').read_text(encoding='utf-8'))
        cards = index.matching('li', 'home-project')
        for number in range(2, (len(self.published) + 8) // 9 + 1):
            page = PageParser((ROOT / f'works/page/{number}/index.html').read_text(encoding='utf-8'))
            page_cards = page.matching('li', 'home-project')
            self.assertLessEqual(len(page_cards), 9)
            cards.extend(page_cards)
        self.assertEqual(len(cards), len(self.published))
        self.assertEqual({c['data-slug'] for c in cards}, {p['slug'] for p in self.published})
        for project in self.projects:
            with self.subTest(project=project['slug']):
                folder = ROOT / 'works' / project['slug']
                self.assertTrue((folder / 'index.html').is_file())
                self.assertTrue((folder / 'project.css').is_file())
                self.assertTrue((ROOT / project['cover'].lstrip('/').split('?')[0]).is_file())
                html = (folder / 'index.html').read_text(encoding='utf-8')
                page = PageParser(html)
                self.assertTrue(page.matching('nav', 'project-section-nav'))
                if project['slug'] in {'karaok', 'lnpulse', 'appliansys', 'calcuoke', 'pypos'}:
                    self.assertTrue(page.matching('div', 'architecture-diagram'))
                    self.assertIn('TODO(J.R.): Review these feature drafts', html)
                    self.assertIn('TODO(J.R.): Replace this factual draft', html)
                for section in ['problem', 'contribution', 'how-it-works', 'result', 'gallery', 'next-steps']:
                    self.assertTrue(any(attrs.get('id') == section for _, attrs in page.nodes), section)
                self.assertNotIn('<details', html)
                self.assertIn('CreativeWork', html)
                self.assertIn('aria-current="page"', html)
                for image in page.matching('img'):
                    self.assertTrue((ROOT / unquote(urlsplit(image['src']).path).lstrip('/')).is_file(), image['src'])
                    self.assertGreater(int(image['width']), 0)
                    self.assertGreater(int(image['height']), 0)

    def test_home_features_follow_published_dates(self):
        home = PageParser((ROOT / 'index.html').read_text(encoding='utf-8'))
        eligible = sorted([p for p in self.published if p.get('featured') is True],
                          key=lambda p: (-int(p['date'].replace('-', '')), p['slug']))[:3]
        self.assertEqual([p['data-slug'] for p in home.matching('li', 'home-project')],
                         [p['slug'] for p in eligible])
        sitemap = (ROOT / 'sitemap.xml').read_text(encoding='utf-8')
        for project in self.projects:
            destination = f"/works/{project['slug']}/"
            if project.get('published', True):
                self.assertIn(destination, sitemap)
            else:
                self.assertNotIn(destination, sitemap)
                self.assertIn('noindex, nofollow', (ROOT / 'works' / project['slug'] / 'index.html').read_text(encoding='utf-8'))

    def test_published_local_links_and_assets_exist(self):
        paths = [ROOT / 'index.html', ROOT / 'works/index.html', ROOT / 'about/index.html', ROOT / 'contact/index.html'] + [ROOT / 'works' / p['slug'] / 'index.html' for p in self.published]
        for path in paths:
            parser = PageParser(path.read_text(encoding='utf-8'))
            for tag, attrs in parser.nodes:
                for attribute in ('href', 'src'):
                    value = attrs.get(attribute, '')
                    url = urlsplit(value)
                    if not value or url.scheme or value.startswith('#'):
                        continue
                    with self.subTest(page=path.name, url=value):
                        self.assertTrue(value.startswith('/'), value)
                        target = ROOT / unquote(url.path).lstrip('/')
                        if target.is_dir():
                            target /= 'index.html'
                        self.assertTrue(target.is_file(), value)
                        if url.fragment and target.suffix == '.html':
                            destination = PageParser(target.read_text(encoding='utf-8'))
                            self.assertTrue(any(a.get('id') == url.fragment for _, a in destination.nodes), value)

    def test_all_screenshots_preserved(self):
        counts = {'lnpulse': 6, 'appliansys': 4, 'calcuoke': 4, 'pypos': 2, 'karaok': 4}
        for slug, count in counts.items():
            html = (ROOT / 'works' / slug / 'index.html').read_text(encoding='utf-8')
            # One hero and all of the original screenshot gallery entries.
            images = [a for a in PageParser(html).matching('img') if a.get('src', '').startswith(f'/works/{slug}/images/')]
            self.assertEqual(len(images), count + 1, slug)


if __name__ == '__main__':
    unittest.main()
