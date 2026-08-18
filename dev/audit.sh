#!/bin/sh
# Static content audit: duplicates, cost/threshold sanity, cross-references.
cd "$(dirname "$0")/.." || exit 1
BUNDLE="${TMPDIR:-/tmp}/bureaucracy-audit-bundle.js"
cat dev/prelude.js js/data.js js/state.js js/utils.js js/ui.js js/game.js js/main.js dev/audit.js > "$BUNDLE"
node "$BUNDLE"
