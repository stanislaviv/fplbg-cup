FPLBG Cup Website V30.8.4

QA baseline: same GW20 results.json used for V30.8.x testing.

Fixes:
- GROUP STANDINGS MP is normalized as W + D + L. This preserves MP=5 at GW20 and yields MP=10 after the completed GW16-GW25 group phase.
- In two-leg Play-off and knockout cards, when only Leg 1 exists the main score badge shows the real Leg 1 score instead of TBD. The detail line still shows Leg 1 score and future Leg 2 as TBD.
- Existing provisional green/red state after Leg 1 is unchanged.
- Existing TBD placeholders, schedule styling, bracket placeholders and Tournament Tree are unchanged.
