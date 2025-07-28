# Contributing to NGX Role Accessor

Thank you for your interest in contributing to NGX Role Accessor! 🎉

This document provides guidelines and information for contributors to help maintain code quality and ensure a smooth collaboration process.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Issue Guidelines](#issue-guidelines)

## 🤝 Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please be respectful, inclusive, and professional in all interactions.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18+ 
- **npm**: Version 9+
- **Angular CLI**: Version 16+
- **Git**: Latest stable version

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/IroshanRathnayake/ngx-role-accessor.git
cd ngx-role-accessor
```

3. Add the upstream repository:

```bash
git remote add upstream https://github.com/IroshanRathnayake/ngx-role-accessor.git
```

## 🛠️ Development Setup

### Install Dependencies

```bash
npm install
```

### Build the Library

```bash
npm run build
```

### Run Tests

```bash
npm run test
```

### Start Development Server

```bash
npm run start
```

### Verify Setup

Run the following to ensure everything is working:

```bash
npm run build && npm run test
```

## 📁 Project Structure

```
ngx-role-accessor/
├── projects/
│   └── ngx-role-accessor/          # Main library source
│       ├── src/
│       │   ├── lib/
│       │   │   ├── services/       # Core RBAC service
│       │   │   ├── directives/     # Structural directives
│       │   │   ├── guards/         # Route guards
│       │   │   ├── pipes/          # Template pipes
│       │   │   ├── utils/          # Utility classes
│       │   │   ├── types/          # TypeScript definitions
│       │   │   └── config/         # Configuration
│       │   └── public-api.ts       # Public API exports
│       └── README.md               # Library documentation
├── src/                            # Demo application
├── docs/                           # Additional documentation
├── scripts/                        # Build and utility scripts
└── tests/                          # Integration tests
```

## 🔄 Development Workflow

### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: New features (`feature/hierarchical-roles`)
- **fix/**: Bug fixes (`fix/permission-caching`)
- **docs/**: Documentation updates (`docs/api-reference`)

### Creating a Feature Branch

```bash
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name
```

### Staying Up to Date

```bash
git fetch upstream
git rebase upstream/develop
```

## 📝 Coding Standards

### TypeScript Guidelines

- **Strict Mode**: All code must pass TypeScript strict mode
- **Type Safety**: Avoid `any` types, use proper type definitions
- **Interfaces**: Define clear interfaces for all public APIs
- **Generics**: Use generics for reusable components

```typescript
// ✅ Good
interface UserContext<T = Record<string, unknown>> {
  userId: string;
  roles: Role[];
  metadata?: T;
}

// ❌ Bad
interface UserContext {
  userId: any;
  roles: any[];
  metadata?: any;
}
```

### Code Style

- **Prettier**: All code is formatted with Prettier
- **ESLint**: Follow ESLint Angular rules
- **Naming**: Use descriptive, meaningful names
- **Comments**: JSDoc for all public APIs

```typescript
/**
 * Checks if the current user has the specified role.
 * 
 * @param role - The role identifier to check
 * @returns Observable that emits true if user has the role
 * 
 * @example
 * ```typescript
 * roleService.hasRole('admin').subscribe(hasRole => {
 *   console.log('User is admin:', hasRole);
 * });
 * ```
 */
hasRole(role: string): Observable<boolean> {
  // Implementation
}
```

### Angular Best Practices

- **Standalone Components**: Use standalone APIs for Angular 16+
- **Signals**: Prefer signals for reactive state management
- **Injection**: Use `inject()` function over constructor injection
- **OnPush**: Use OnPush change detection where applicable

### File Organization

- **Barrel Exports**: Use index files for clean imports
- **Single Responsibility**: One class/interface per file
- **Naming Convention**: 
  - Services: `*.service.ts`
  - Directives: `*.directive.ts`
  - Guards: `*.guard.ts`
  - Types: `*.types.ts`
  - Utils: `*.util.ts`

## 🧪 Testing Guidelines

### Test Structure

```typescript
describe('RoleService', () => {
  let service: RoleService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RoleService]
    });
    service = TestBed.inject(RoleService);
  });

  describe('hasRole', () => {
    it('should return true when user has role', () => {
      // Arrange
      service.setRoles(['admin']);
      
      // Act & Assert
      service.hasRole('admin').subscribe(result => {
        expect(result).toBe(true);
      });
    });
  });
});
```

### Testing Requirements

- **Unit Tests**: All services, directives, and pipes must have unit tests
- **Coverage**: Minimum 90% code coverage
- **Integration Tests**: Test component interactions
- **E2E Tests**: Critical user flows

### Running Tests

```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run e2e

# Watch mode
npm run test:watch
```

## 📝 Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes
- **perf**: Performance improvements
- **ci**: CI/CD changes

### Examples

```bash
feat(directives): add animation support to hasRole directive

- Add configurable enter/leave animations
- Support custom CSS classes
- Maintain backward compatibility

Closes #123
```

```bash
fix(service): resolve memory leak in role caching

The LRU cache was not properly disposing of observables,
causing memory leaks in long-running applications.

Fixes #456
```

## 🔄 Pull Request Process

### Before Submitting

1. **Update Documentation**: Ensure all changes are documented
2. **Run Tests**: All tests must pass
3. **Check Coverage**: Maintain or improve test coverage
4. **Build Successfully**: Library must build without errors
5. **Format Code**: Run Prettier and ESLint

### PR Checklist

- [ ] Branch is up to date with develop
- [ ] All tests pass locally
- [ ] Code coverage is maintained/improved
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts
- [ ] Changes are backward compatible (or breaking changes are documented)

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Documentation
- [ ] JSDoc comments updated
- [ ] README updated
- [ ] Examples updated

## Breaking Changes
List any breaking changes and migration steps
```

### Review Process

1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Reviewer tests the changes locally
4. **Documentation**: Ensure documentation is adequate
5. **Merge**: Squash and merge to maintain clean history

## 🚀 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Update Version**: Update version in `package.json`
2. **Update Changelog**: Document all changes
3. **Create Release**: Tag and create GitHub release
4. **Publish**: Publish to npm registry

### Changelog Format

```markdown
## [2.1.0] - 2025-01-15

### Added
- Hierarchical role support with inheritance
- Multi-tenant architecture with tenant isolation
- LRU caching for improved performance

### Changed
- Updated Angular peer dependency to 16+
- Improved TypeScript strict mode compatibility

### Fixed
- Memory leak in role caching system
- Race condition in permission checks

### Breaking Changes
- `setRoles()` now accepts `Role[]` instead of `string[]`
```

## 🐛 Issue Guidelines

### Before Creating an Issue

1. **Search Existing Issues**: Check if the issue already exists
2. **Check Documentation**: Ensure it's not a usage question
3. **Reproduce**: Provide steps to reproduce the issue
4. **Version Info**: Include library and Angular versions

### Issue Templates

#### Bug Report

```markdown
**Describe the bug**
A clear description of the bug

**To Reproduce**
1. Set up component with '...'
2. Call method '...'
3. See error

**Expected behavior**
What you expected to happen

**Environment:**
- Angular version: [e.g. 16.2.0]
- Library version: [e.g. 2.0.0]
- Browser: [e.g. Chrome 96]

**Additional context**
Any other context about the problem
```

#### Feature Request

```markdown
**Is your feature request related to a problem?**
A clear description of the problem

**Describe the solution you'd like**
A clear description of what you want to happen

**Describe alternatives you've considered**
Any alternative solutions or features you've considered

**Additional context**
Any other context or screenshots about the feature request
```

## 🏆 Recognition

Contributors will be recognized in:

- **README.md**: Contributors section
- **CHANGELOG.md**: Release notes
- **GitHub Releases**: Release descriptions
- **npm Package**: Contributors field

## 📞 Getting Help

- **GitHub Discussions**: For questions and community discussion
- **GitHub Issues**: For bugs and feature requests
- **Email**: [meet.iroshan@gmail.com] for security issues

## 📜 License

By contributing to NGX Role Accessor, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to NGX Role Accessor! Your efforts help make this library better for the entire Angular community. 🚀
