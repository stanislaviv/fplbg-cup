V30.8.6 — GW29 phase transition fix
Built from confirmed working V30.8.4.

Change only:
- When a knockout round is fully decided, its real winners populate the next round even if future KNOCKOUT rows are absent from the QA JSON.
- GW29: completed 1/32 populates 1/16 with the actual 32 winners; GW30/GW31 scores remain unknown.
- Later rounds remain placeholders until their source round is completed.

Preserved:
- V30.8.4 Group Standings MP logic
- Leg 1 provisional score/color logic
- Qualification and Group Schedule styling
- Existing bracket/tree structure
- No future-result leakage
