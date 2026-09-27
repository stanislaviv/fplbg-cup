FPLBG Cup Website V30.8.9

Cache-hardening release based on confirmed V30.8.8.

Changes only:
- loader.js cache-buster updated to v=30.8.9 in index.html.
- app.js cache-buster updated to v=30.8.9.
- results.json is fetched with cache:no-store plus a timestamp query parameter.
- rules.json is fetched with cache:no-store plus a timestamp query parameter.

No tournament logic, bracket logic, placeholders, styling, or results data changed.
QA: after GitHub Pages deploy, test with normal F5 (not Ctrl+F5).
