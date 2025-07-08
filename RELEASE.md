# Release Process Documentation

This document describes the automated release process for the aiOla JavaScript SDK.

## Overview

The release process is fully automated using GitHub Actions and semantic-release. When code is pushed to the `main` or `rc` branches, the system automatically:

1. Runs quality checks (tests, linting, build)
2. Analyzes commit messages to determine version bump
3. Updates version in package.json
4. Generates/updates CHANGELOG.md
5. Publishes to npm
6. Creates a GitHub release
7. Tags the release

## Branch Strategy

- **`main`** - Production releases
- **`rc`** - Release candidate releases
- **Feature branches** - Development work

## Commit Message Convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat:` - New features (triggers minor version bump)
- `fix:` - Bug fixes (triggers patch version bump)
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Maintenance tasks

### Breaking Changes

To indicate a breaking change, add `BREAKING CHANGE:` in the commit body or footer:

```
feat: add new API method

BREAKING CHANGE: The old API method has been removed
```

## Version Bumping Rules

- **Patch** (0.0.x): Bug fixes
- **Minor** (0.x.0): New features (backward compatible)
- **Major** (x.0.0): Breaking changes

## Setup Requirements

### GitHub Secrets

Configure these secrets in your GitHub repository settings:

1. **NPM_TOKEN**
   - Go to https://www.npmjs.com/settings/tokens
   - Create a new token with "Automation" type
   - Add it to GitHub repository secrets

2. **GITHUB_TOKEN** (automatically provided)

### Local Development

For local testing of the release process:

```bash
# Install dependencies
npm install

# Set NPM token
export NPM_TOKEN=your_token_here

# Test release (dry run)
npx semantic-release --dry-run
```

## Configuration Files

- `.releaserc.json` - Semantic-release configuration
- `.github/workflows/cd.yml` - Main release workflow
- `.github/workflows/ci.yml` - Continuous integration

## Troubleshooting

### Release Not Triggering

- Ensure commits follow conventional format
- Check that you're pushing to `main` or `rc` branch
- Verify GitHub Actions are enabled for the repository

### NPM Publish Fails

- Verify NPM_TOKEN secret is set correctly
- Ensure you have publish permissions for the package
- Check if the version already exists on npm

### Version Conflicts

- If a version already exists, semantic-release will skip the release
- Check the GitHub Actions logs for detailed error messages

## Manual Release

In emergency situations, you can manually trigger a release:

1. Create a commit with a conventional commit message
2. Push to `main` or `rc` branch
3. The workflow will automatically trigger

## Rollback

If a bad release is published:

1. Unpublish from npm: `npm unpublish @aiola/sdk@version`
2. Delete the GitHub release
3. Force push to remove the tag: `git push origin :refs/tags/v1.2.3`
4. Create a new commit with a fix and push again
