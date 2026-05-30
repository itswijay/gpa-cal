# Contributing to GPA Calculator

Thank you for your interest in contributing to the GPA Cal! This guide will help you get started with contributing to the project, especially for adding new faculties and subjects.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Adding New Faculties](#adding-new-faculties)
- [Code Standards](#code-standards)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project follows a simple code of conduct:

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Keep discussions professional and on-topic

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- A code editor with TypeScript support (VS Code recommended)

### Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/thewijay/gpa-cal.git
   cd gpa-cal
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Verify TypeScript compilation**
   ```bash
   npx tsc --noEmit
   ```

## Suggesting New Curricula & Semester Updates (No Code Needed!)

Adding or expanding university curriculum is now completely **visual, dynamic, and code-free**! You no longer need to edit any TypeScript files or submit GitHub Pull Requests to add your curriculum. 

Follow these simple steps:

1. **Sign In:** Sign in with Google to enable cloud synchronization.
2. **Access Creator:** Click on the **Custom Degree Creator** (`GraduationCap` icon) in the navigation menu.
3. **Configure details:** 
   * Select your **University** and **Faculty** (or select **"Add Custom / New"** to type new ones).
   * Select your **Degree Program** (or select **"Add Custom / New"** to define a brand-new degree).
4. **Auto-populate:** If the degree program is already preloaded in our database but has missing semesters (e.g. only Semesters 1-3 are defined), selecting the degree will **auto-populate** those existing semesters and subjects for you as editable fields!
5. **Add/Edit Semesters:**
   * Append missing semesters (e.g. click **"+ Add Semester"** to add Semester 4, 5, etc.).
   * Modify or verify subjects, codes, and credit values in the list.
6. **Submit Suggestion:** 
   * Turn **ON** the toggle: **"Suggest this degree program for addition to the public university database"** at the bottom of the page.
   * Click **Save Custom Degree**.
7. **Admin Review:** Your suggested curriculum will be immediately dispatched to our secure **Admin Moderation Console**. Once an administrator verifies and approves your suggestion, it is instantly merged globally into our cloud catalog for all other students to use!

## Code Standards

### TypeScript

- Use strict TypeScript (no `any` types)
- Import types with `import type { ... }`
- Add JSDoc comments for complex functions
- Follow existing naming conventions

### File Structure

```typescript
// ✅ Good
import type { DegreeMap } from '../types'

export const facultyData: DegreeMap = {
  // data here
}

// ❌ Bad
export const data = {
  // no types, unclear naming
}
```

### Subject Data Format

```typescript
// ✅ Good
{
  code: 'CS101',           // Short, descriptive, unique
  name: 'Programming I',   // Official subject name
  credits: 3               // Numeric value
}

// ❌ Bad
{
  code: 'VERY_LONG_CODE_NAME', // Too long
  name: 'prog',                // Too short
  credits: '3'                 // String instead of number
}
```

## Development Workflow

### Branch Naming

- `feat/add-engineering-faculty` - Adding new faculty
- `fix/duplicate-subject-codes` - Fixing data issues
- `docs/update-contributing` - Documentation updates

### Commit Messages

Follow conventional commits:

```bash
# Features
feat(data): add Engineering faculty with CS and EE degrees

# Fixes
fix(data): resolve duplicate subject codes in Applied Sciences

# Documentation
docs: add contributing guidelines for new faculties
```

## Testing

### Manual Testing Steps

1. **Faculty Selection**: Verify your faculty appears in dropdown
2. **Degree Selection**: All degrees load correctly
3. **Semester Navigation**: All semesters are accessible
4. **Subject Display**: Core and elective subjects show properly
5. **Grade Entry**: Can select grades for all subjects
6. **GPA Calculation**: Results are mathematically correct
7. **Data Persistence**: Grades save and reload correctly
8. **Edit Mode**: Can modify previously entered grades

### Automated Checks

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build verification
npm run build
```

## Pull Request Process

### Before Submitting

1. **Test thoroughly** following the testing checklist
2. **Run all checks**: `npm run lint && npx tsc --noEmit`
3. **Update documentation** if needed
4. **Write clear commit messages**

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] New UI feature
- [ ] Core calculation engine fix
- [ ] UI / CSS Styling update
- [ ] Bug fix
- [ ] Documentation update

## Testing Checklist

- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Linting checks pass successfully (`npm run lint`)
- [ ] Local build generates successfully (`npm run build`)
- [ ] Tested locally on mobile/desktop screens
```

### Review Process

1. Automated checks (linting, type-checking, build checks) must pass.
2. Code review and feature approval by repository maintainers.

## Common Issues and Solutions

### TypeScript Compilation Errors
* **Error:** `Type 'string' is not assignable to type 'number'`
* **Solution:** Ensure all numeric values (credits, points, etc.) are strictly numbers, not string representations.

### Theme / Styling Glitches
* **Problem:** Styles look broken or inconsistent in light/dark mode.
* **Solution:** Verify tailwind variables and custom CSS styles to ensure semantic standard values are used.

## Quick Reference

### Core Code Locations
* **Authentication:** `src/hooks/useAuth.ts` and `src/contexts/AuthContext.tsx`
* **Firestore Service:** `src/firebase/firestore.ts`
* **Custom Degree Creator:** `src/pages/CustomDegreePage.tsx`
* **Main Calculator UI:** `src/pages/addGrades.tsx`
* **Types:** `src/data/types.ts`
* **Grading Values:** `src/data/grading.ts`

### Testing Commands
```bash
npm run dev          # Start development server
npx tsc --noEmit     # Execute strict TypeScript type checks
npm run lint         # Run ESLint checks
npm run build        # Verify production compilation
```

---

**Thank you for contributing to make this GPA Cal better for students! 🎓**
