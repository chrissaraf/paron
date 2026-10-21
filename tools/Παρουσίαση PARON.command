#!/bin/zsh
cd "$(dirname "$0")/.."
node tools/presentation/server.js --lan
