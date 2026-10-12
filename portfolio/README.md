# Portfolio inputs for the investing brief

A scheduled Claude routine writes you an investing brief roughly every 3 days.
It reads this folder to personalize the **Portfolio exposure & drift** section.
Both files are optional — without them the brief still runs, just without
holdings-specific analysis.

| File | What it is |
| --- | --- |
| `holdings.csv` | Your Fidelity positions export, unchanged. In Fidelity: **Accounts & Trade → Portfolio → Positions → Download**. Rename it to `holdings.csv`. |
| `target.json` | Your target allocation in percent (Stocks / Bonds / Cash) plus optional notes about your goals and horizon. |

To update: on GitHub, open this folder → **Add file → Upload files**, drop in the
new `holdings.csv`, and commit. Re-upload whenever you want the brief to see
fresh numbers.

**Privacy:** this repository is private, and the GitHub Pages site only publishes
the built app (`dist/`), so nothing in this folder appears on the public site.
It is still stored in Git history — skip `holdings.csv` if you'd rather not keep
positions in the repo.
