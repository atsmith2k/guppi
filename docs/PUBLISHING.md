# 📦 Publishing GUPPI to NPM

This document outlines the step-by-step process for publishing **GUPPI** as a public, installable package on the NPM registry.

---

## 📋 Prerequisites

1. An account on [npmjs.com](https://www.npmjs.com/).
2. Member or owner access to publish under the `guppi` package name (or an `@organization/guppi` scope).
3. `npm` CLI logged in locally (`npm login`) or an `NPM_TOKEN` secret set in GitHub Actions.

---

## 🛠️ Automated Publishing (Recommended)

GUPPI includes a GitHub Actions workflow in [`.github/workflows/publish.yml`](../.github/workflows/publish.yml).

### Step 1: Add NPM Token to GitHub Secrets
1. Go to your NPM account $\rightarrow$ **Access Tokens** $\rightarrow$ **Generate New Token** (Automation / Publish token).
2. Go to your GitHub repository: **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.
3. Create a new repository secret named `NPM_TOKEN` and paste your NPM token.

### Step 2: Create & Push a Version Tag
```bash
# 1. Update version in package.json (e.g. 2.0.0)
npm version 2.0.0 -m "Release v2.0.0"

# 2. Push commits and release tag to GitHub
git push origin main --tags
```

The GitHub Action will automatically:
1. Checkout the code.
2. Install dependencies (`npm ci`).
3. Run builds & test suites (`npm run prepublishOnly`).
4. Publish the package publicly to `registry.npmjs.org`.

---

## 💻 Manual Publishing via CLI

If you prefer publishing manually from your terminal:

### Step 1: Verify Dry Run Payload
Before publishing, check the tarball payload to verify no unwanted files are included:
```bash
npm run pack:check
```

### Step 2: Run Full Build & Test Suite
```bash
npm run prepublishOnly
```

### Step 3: Login & Publish
```bash
# 1. Log in to npm
npm login

# 2. Publish publicly
npm publish --access public
```

---

## 🚀 Verifying Installation After Release

Once published, users worldwide can install and use GUPPI via:

```bash
# Global installation
npm install -g @atsmith2k/guppi

# Instant npx execution without global install
npx @atsmith2k/guppi status

# Initialize in any codebase
guppi init

# Start server & Web Control Deck
guppi start
```
