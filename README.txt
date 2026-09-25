FPLBG Cup Website V22 – JSON Integration

- V21 visual design preserved.
- Tournament data is loaded from results.json generated from V5 Public Export.
- data.js is no longer loaded by the website.
- Tournament podium is read from TOURNAMENT PODIUM in results.json; the website does not calculate the champion/third place winner.
- Rules remain a static presentation resource in rules.json.
- Group schedule currently uses the normalized pairing data available in GROUP SCHEDULE; score/stat fields are shown only when present in the export.

Publish workflow: V5 Refresh/QA -> Power Automate -> results.json -> replace results.json in GitHub.
