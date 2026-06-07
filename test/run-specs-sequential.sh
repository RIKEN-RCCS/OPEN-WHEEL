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

SPECS=()
while IFS= read -r line; do
  SPECS+=("$line")
done < <(find cypress/e2e -name "*.cy.js" -not -path "*/gfarm/*" | sort)

echo "Running ${#SPECS[@]} spec files sequentially... (bail=$BAIL)"

for spec in "${SPECS[@]}"; do
  echo ""
  echo "=== Running: $spec ==="
  if ! npx cypress run --browser chrome --spec "$spec"; then
    FAILED_SPECS+=("$spec")
    if [ "$BAIL" = true ]; then
      echo "=== Bail: stopping after first failure ==="
      exit 1
    fi
  fi
done

echo ""
echo "=== Summary: ${#FAILED_SPECS[@]} of ${#SPECS[@]} specs failed ==="

if [ ${#FAILED_SPECS[@]} -gt 0 ]; then
  echo "Failed specs:"
  for s in "${FAILED_SPECS[@]}"; do
    echo "  - $s"
  done
  exit 1
fi

exit 0
