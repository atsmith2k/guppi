#!/usr/bin/env bash
set -e

# Script to sync and publish the local wiki/ directory to GitHub Wiki git repository
REPO_URL="https://github.com/atsmith2k/guppi.wiki.git"
WIKI_DIR="/tmp/guppi_wiki_sync"

echo "Syncing GUPPI documentation to GitHub Wiki..."

TOKEN=$(gh auth token 2>/dev/null || echo "")

if [ -n "$TOKEN" ];  then
    AUTH_REPO_URL="https://atsmith2k:${TOKEN}@github.com/atsmith2k/guppi.wiki.git"
else
    AUTH_REPO_URL="$REPO_URL"
fi

rm -rf "$WIKI_DIR"
mkdir -p "$WIKI_DIR"

if git clone "$AUTH_REPO_URL" "$WIKI_DIR" 2>/dev/null; then
    echo "Cloned existing GitHub Wiki repository."
    cd "$WIKI_DIR"
else
    echo "Initializing new GitHub Wiki repository payload..."
    cd "$WIKI_DIR"
    git init
    git branch -m master
    git remote add origin "$AUTH_REPO_URL"
fi

cp -R /Users/ashton/git/something/wiki/* "$WIKI_DIR/"

git add -A
if git diff --staged --quiet; then
    echo "No wiki changes to commit."
else
    git commit -m "docs: update GitHub wiki documentation suite"
    echo "Pushing wiki updates to GitHub..."
    git push -u origin master || git push -u origin main
    echo "Wiki updated successfully."
fi
