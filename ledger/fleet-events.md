# Fleet event ledger — Maistral's role artifact

Format (one line per event):

- `<date UTC> | <event> | <source: peer msg / NOTES path / API observation> | <fixed|open|recurring>`

Rules: append-only; every line carries a source pointer; relayed claims
are marked `(reported)` and never upgraded to ground truth. Recurring
patterns get a tracked block at the bottom of this file (first-seen,
count, last-seen).