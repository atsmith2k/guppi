# Publishing GUPPI to NPM

This document outlines the process for publishing **GUPPI** as a package on the NPM registry.

---

## Prerequisites

1. An account on [npmjs.com](https://www.npmjs.com/).
2. Access to publish under the `@atsmith2k/guppi` package name or configured scope.
3. `npm` CLI logged in locally (`npm login`) or an `NPM_TOKEN` secret set in GitHub Actions.

---

## Automated Publishing (Recommended)

GUPPI includes a GitHub Actions workflow in [`.github/workflows/publish.yml`](../.github/workflows/publish.yml).

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

The GitHub Action will automatically:
1. Check out the code.
2. Install dependencies (`npm ci`).
3. Run builds and test suites (`npm run prepublishOnly`).
4. Publish the package publicly to `registry.npmjs.org`.

---

## Manual Publishing via CLI

To publish manually from the terminal:

### Step 1: Verify Dry Run Payload
Before publishing, check the tarball payload to verify included files:
```bash
npm run pack:check
```

### Step 2: Run Full Build and Test Suite
```bash
npm run prepublishOnly
```

### Step 3: Login and Publish
```bash
# 1. Log in to npm
npm login

# 2. Publish publicly
npm publish --access public
```

---

## Verifying Installation After Release

Once published, users can install and use GUPPI via:

```bash
# Global installation
npm install -g @atsmith2k/guppi

# Execution via npx
npx @atsmith2k/guppi status

# Initialize in any codebase
guppi init

# Start server and Web Control Deck
guppi start
```

