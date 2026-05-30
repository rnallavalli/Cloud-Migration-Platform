# Contributing to Cloud Migration Platform

We welcome contributions from the community! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome diverse perspectives
- Assume good intentions
- Focus on constructive feedback

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature
4. Make your changes
5. Submit a pull request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/rnallavalli/Cloud-Migration-Platform.git
cd Cloud-Migration-Platform

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
npm install

# Start development environment
docker-compose up -d
```

## Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions

## Commit Message Guidelines

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, test, chore

Example:
```
feat(assessment): add cloud readiness scoring

Added new scoring algorithm for cloud readiness assessment.
Includes tests and documentation.

Closes #123
```

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass: `pytest` and `npm test`
4. Update CHANGELOG.md
5. Submit PR with clear description
6. Wait for review and address feedback

## Testing

```bash
# Run Python tests
pytest
pytest --cov=src

# Run JavaScript tests
npm test
npm test -- --watch
```

## Code Style

- Python: PEP 8 (use flake8)
- JavaScript: ESLint configured in project
- Use prettier for formatting

```bash
# Format code
black src/
prettier --write "src/**/*.js"

# Lint code
flake8 src/
npm run lint
```

## Documentation

- Update README.md for major changes
- Add docstrings to functions and classes
- Update relevant docs in `docs/` folder
- Include examples for new features

## Reporting Issues

When reporting issues, include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots/logs if applicable

## Questions?

- Open a discussion in GitHub Discussions
- Check existing issues and PRs
- Review documentation in `/docs`

Thank you for contributing!