#!/bin/sh
# Headless test suite: DOM stubs + game files + assertions, plain node.
cd "$(dirname "$0")/.." || exit 1
BUNDLE="${TMPDIR:-/tmp}/bureaucracy-tests-bundle.js"
cat dev/prelude.js js/data.js js/state.js js/utils.js js/ui.js js/game.js js/main.js dev/tests.js > "$BUNDLE"
node "$BUNDLE"
status=$?
[ $status -ne 0 ] && echo "TESTS FAILED (exit $status)"
exit $status
