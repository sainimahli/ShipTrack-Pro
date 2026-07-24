#!/usr/bin/env sh
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
if [ -x "$SCRIPT_DIR/backend/mvnw" ]; then
  exec "$SCRIPT_DIR/backend/mvnw" "$@"
else
  echo "Maven wrapper not found. Expected $SCRIPT_DIR/backend/mvnw."
  exit 1
fi
