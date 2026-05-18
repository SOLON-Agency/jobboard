#!/bin/sh
# Shared by hooks under .githooks — must be sourced: . "$(dirname "$0")/ensure-npm.sh"
ensure_npm_in_path() {
  if command -v npm >/dev/null 2>&1; then
    return 0
  fi

  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1090,SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" --no-use 2>/dev/null || true

  if ! command -v npm >/dev/null 2>&1 && command -v fnm >/dev/null 2>&1; then
    eval "$(fnm env --use-on-cd 2>/dev/null)" 2>/dev/null || true
  fi
  if ! command -v npm >/dev/null 2>&1 && [ -s "$HOME/.fnm/fnm" ]; then
    eval "$($HOME/.fnm/fnm env 2>/dev/null)" 2>/dev/null || true
  fi

  export PATH="$HOME/.volta/bin:$PATH"
  export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$PATH"

  if ! command -v npm >/dev/null 2>&1; then
    echo ""
    echo "❌  npm not found. Make sure Node.js is installed and on your PATH."
    echo "   To bypass hook checks: SKIP_CODEGEN=1 SKIP_BUILD=1 SKIP_DEPLOY=1 SKIP_MIGRATIONS=1 git commit ..."
    echo ""
    exit 1
  fi
}
