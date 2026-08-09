# Publishing GUPPI to NPM

This document outlines the process for publishing **GUPPI** as a package on the NPM registry.

---

## Prerequisites

1. An account on [npmjs.com](https://www.npmjs.com/).
2. Access to publish under the `@atsmith2k/guppi` package name or configured scope.
3. `npm` CLI logged in locally (`npm login`) or an `NPM_TOKEN` secret set in GitHub Actions.

---

## Automated Publishing (Recommended)

GUPPI includes a GitHub Actions workflow in `.github/workflows/publish.yml`.

### Step 1: Add NPM Token to GitHub Secrets
1. Go to your NPM account $\rightarrow$ **Access Tokens** $\rightarrow$ **Generate New Token** (Automation / Publish token).
2. Go to your GitHub repository: **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.
3. Create a new repository secret named `NPM_TOKEN` and paste your NPM token.

### Step 2: Create and Push a Version Tag
```bash
# 1. Update version in package.json (e.g. 2.0.0)
npm version 2.0.0 -m "Release v2.0.0"

# 2. Push commits and release tag to GitHub
git push origin main --tags
```

---

## Manual Publishing via CLI

To publish manually from the terminal:

### Step 1: Verify Dry Run Payload
```bash
npm run pack:check
```

### Step 2: Run Full Build and Test Suite
```bash
npm run prepublishOnly
```

### Step 3: Login and Publish
```bash
npm login
npm publish --access public
```
