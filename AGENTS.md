# Agent guide

This repository inherits the global Codex project policy. The rules below cover
only dnd-stat-roller's product, verification, licensing, and deployment
requirements.

## Product boundary

- dnd-stat-roller is a small, static D&D 5e ability-score roller contained in
  `index.html`. Keep it usable without an account, backend, database, or build
  step.
- Preserve exactly six ability scores in STR, DEX, CON, INT, WIS, CHA order.
- Supported dice methods are 4d6 drop lowest and straight 3d6. Adding or
  changing a method is a product change and requires explicit approval.
- Every displayed score must be an integer from 3 through 18. The six scores
  must sum to the configured target from 36 through 108; the default remains
  72. Preserve the rank order of the raw rolls when balancing them.
- English, German, Spanish, French, and Simplified Chinese are supported.
  Keep all five dictionaries and visible controls aligned when copy changes.
- Settings and at most 20 history entries remain local to the browser under the
  existing versioned storage keys. Do not add accounts, telemetry, or remote
  persistence without explicit product approval.

## Verification

- Run `npm ci` when a clean installation is required. The lockfile intentionally
  contains no third-party packages.
- During Coding, select the checks for the changed behavior and verify UI
  changes in the directly affected flows and viewports.
- In the PR phase, run `npm test` for JavaScript syntax, product-contract,
  dice-mode, balancing, localization, local-storage, and legal-link checks.
- For UI or interaction changes, the full PR browser check covers desktop and
  mobile: both dice methods, target editing, all language controls, a completed
  roll, history persistence and restore, and the absence of horizontal overflow.
- Pull requests currently run the same automated test suite on Node 22 through
  `.github/workflows/ci.yml`, including Draft PRs; CI does not yet distinguish
  the two phases.
- For browser checks, the user starts the README's `python -m http.server 8000`
  from the repository root. Check `http://127.0.0.1:8000/` for a successful
  response before browser tests. No build, backend, or database is required.

## Deployment and release

- GitHub Pages serves production at
  `https://sirrio.github.io/dnd-stat-roller/` directly from the root of `main`.
- `.github/workflows/deploy.yml` tests and deploys the repository root on every
  push to `main`. Merging a pull request therefore automatically deploys
  production. Merge approval also approves deployment and must state both
  actions explicitly.
- After deployment, smoke-test the live URL on desktop and mobile before
  creating the annotated version tag and matching GitHub release.
- `package.json`, the root package metadata in `package-lock.json`, the release
  branch, the final tag, and the GitHub release must use the same semantic
  version.
- Release notes describe player-visible outcomes. Pure policy or CI releases
  must be identified as maintenance releases without implying gameplay changes.

## Licensing and legal links

- The project is MIT licensed. Keep `LICENSE` and the README license statement
  aligned.
- Preserve the footer links to sirrio.de, Impressum, and Datenschutz. Review
  them whenever hosting, data handling, or external services change.
