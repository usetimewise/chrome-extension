#!/usr/bin/env bash

set -euo pipefail

readonly CODEX_VERSION="0.144.5"

sudo npm install --global "@openai/codex@${CODEX_VERSION}"
sudo install -d -o node -g node -m 700 "${CODEX_HOME}"
sudo install -d -o node -g node -m 755 node_modules
install -m 600 .devcontainer/codex-config.toml "${CODEX_HOME}/config.toml"
npm ci
