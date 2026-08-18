#!/bin/sh
# Full-run pacing simulation (greedy bot through all 6 stages).
cd "$(dirname "$0")/.." || exit 1
BUNDLE="${TMPDIR:-/tmp}/bureaucracy-sim-bundle.js"
cat dev/prelude.js js/data.js js/state.js js/utils.js js/ui.js js/game.js js/main.js dev/sim3.js > "$BUNDLE"
node "$BUNDLE"
