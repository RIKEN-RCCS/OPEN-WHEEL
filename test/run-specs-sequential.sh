#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

BAIL=false
for arg in "$@"; do
  case $arg in
    -b|--bail) BAIL=true ;;
  esac
done

FAILED_SPECS=()
SUMMARY_ROWS=()
TOTAL_TESTS=0
TOTAL_PASSING=0
TOTAL_FAILING=0
TOTAL_PENDING=0
TOTAL_SKIPPED=0

#chrome's renderer process occasionally crashes for infra reasons unrelated to the
#test itself (see https://on.cypress.io/renderer-process-crashed). cypress already
#fails just that spec and lets this script move on to the next one, so it never
#hangs - but a crash isn't a real test failure, so retry the whole spec a few times
#before accepting it as one.
MAX_CRASH_RETRIES=2

SPECS=()
while IFS= read -r line; do
  SPECS+=("$line")
done < <(find cypress/e2e -name "*.cy.js" -not -path "*/gfarm/*" -not -path "*/tutorial/*" | sort)

echo "Running ${#SPECS[@]} spec files sequentially... (bail=$BAIL)"

for spec in "${SPECS[@]+"${SPECS[@]}"}"; do
  echo ""
  echo "=== Running: $spec ==="

  attempt=0
  while true; do
    attempt=$((attempt + 1))
    SPEC_LOG="$(mktemp)"
    SPEC_STATUS=0
    npx cypress run --browser chrome --spec "$spec" 2>&1 | tee "$SPEC_LOG" || SPEC_STATUS=$?

    #cypress keeps ANSI color codes even though stdout is piped, because it
    #detects the CI env var GitHub Actions sets and assumes ANSI rendering
    #support - e.g. "Tests:" is followed by a color-reset escape sequence
    #before the whitespace/number, not by the whitespace directly. Strip all
    #ANSI CSI sequences before parsing so the label/number regexes below can
    #actually match.
    CLEAN_LOG="$(mktemp)"
    sed -E $'s/\x1b\\[[0-9;]*[A-Za-z]//g' "$SPEC_LOG" > "$CLEAN_LOG"
    mv "$CLEAN_LOG" "$SPEC_LOG"

    if [ "$SPEC_STATUS" -ne 0 ] && [ "$attempt" -le "$MAX_CRASH_RETRIES" ] && grep -q "Chrome Renderer process just crashed" "$SPEC_LOG"; then
      echo "=== $spec: Chrome renderer crashed (attempt $attempt/$((MAX_CRASH_RETRIES + 1))) - exiting and rerunning this spec ==="
      rm -f "$SPEC_LOG"
      continue
    fi
    break
  done
  if [ "$attempt" -gt 1 ]; then
    echo "=== $spec: finished after $attempt attempts ==="
  fi

  #cypress prints a "(Results)" box with these fields at the end of every run,
  #even on a crashed/failed spec - parse it for the step summary table.
  tests=$(grep -oE "Tests:[[:space:]]+[0-9]+" "$SPEC_LOG" | tail -1 | grep -oE "[0-9]+" || true)
  passing=$(grep -oE "Passing:[[:space:]]+[0-9]+" "$SPEC_LOG" | tail -1 | grep -oE "[0-9]+" || true)
  failing=$(grep -oE "Failing:[[:space:]]+[0-9]+" "$SPEC_LOG" | tail -1 | grep -oE "[0-9]+" || true)
  pending=$(grep -oE "Pending:[[:space:]]+[0-9]+" "$SPEC_LOG" | tail -1 | grep -oE "[0-9]+" || true)
  skipped=$(grep -oE "Skipped:[[:space:]]+[0-9]+" "$SPEC_LOG" | tail -1 | grep -oE "[0-9]+" || true)
  rm -f "$SPEC_LOG"
  tests=${tests:-0}; passing=${passing:-0}; failing=${failing:-0}; pending=${pending:-0}; skipped=${skipped:-0}

  TOTAL_TESTS=$((TOTAL_TESTS + tests))
  TOTAL_PASSING=$((TOTAL_PASSING + passing))
  TOTAL_FAILING=$((TOTAL_FAILING + failing))
  TOTAL_PENDING=$((TOTAL_PENDING + pending))
  TOTAL_SKIPPED=$((TOTAL_SKIPPED + skipped))

  status_icon="✅"
  if [ "$SPEC_STATUS" -ne 0 ]; then
    status_icon="❌"
    FAILED_SPECS+=("$spec")
  fi
  SUMMARY_ROWS+=("| $status_icon $spec | $tests | $passing | $failing | $pending | $skipped |")

  if [ "$SPEC_STATUS" -ne 0 ] && [ "$BAIL" = true ]; then
    echo "=== Bail: stopping after first failure ==="
    break
  fi
done

echo ""
echo "=== Summary: ${#FAILED_SPECS[@]} of ${#SPECS[@]} specs failed ==="

if [ ${#FAILED_SPECS[@]} -gt 0 ]; then
  echo "Failed specs:"
  for s in "${FAILED_SPECS[@]+"${FAILED_SPECS[@]}"}"; do
    echo "  - $s"
  done
fi

#write a Markdown summary to the GitHub Actions job summary page when running
#in CI, so pass/fail is visible at a glance without opening the raw log. Local
#runs (GITHUB_STEP_SUMMARY unset) are unaffected.
echo "DEBUG: GITHUB_STEP_SUMMARY=${GITHUB_STEP_SUMMARY:-<unset>}"
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "## E2E test results"
    echo ""
    echo "**${TOTAL_PASSING}/${TOTAL_TESTS} passing** across ${#SPECS[@]} spec files (${TOTAL_FAILING} failing, ${TOTAL_PENDING} pending, ${TOTAL_SKIPPED} skipped)"
    echo ""
    echo "| Spec | Tests | Passing | Failing | Pending | Skipped |"
    echo "|---|---|---|---|---|---|"
    for row in "${SUMMARY_ROWS[@]+"${SUMMARY_ROWS[@]}"}"; do
      echo "$row"
    done
    if [ ${#FAILED_SPECS[@]} -gt 0 ]; then
      echo ""
      echo "### Failed specs"
      for s in "${FAILED_SPECS[@]+"${FAILED_SPECS[@]}"}"; do
        echo "- \`$s\`"
      done
    fi
  } >> "$GITHUB_STEP_SUMMARY"
  WRITE_STATUS=$?
  echo "DEBUG: step summary write exit code: $WRITE_STATUS, file now has $(wc -l < "$GITHUB_STEP_SUMMARY") lines"
fi

if [ ${#FAILED_SPECS[@]} -gt 0 ]; then
  exit 1
fi

exit 0
