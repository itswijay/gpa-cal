# GPA Cal

A comprehensive, clean and user-friendly GPA calculation and tracking application designed for academic institutions. The platform provides students with tools to manage their academic progress, calculate semester and cumulative GPAs, and track performance across multiple degree programs and faculties.

<div style="display: flex; flex-wrap: wrap; gap: 10px;">

  <a href="https://postimg.cc/G49KG2mP" target="_blank">
    <img src="https://i.postimg.cc/wjQrKRKr/Screenshot-20250602-180908.png" width="200" />
  </a>

  <a href="https://postimg.cc/TLjJf5tx" target="_blank">
    <img src="https://i.postimg.cc/B6kY5xDj/Screenshot-20250602-180721.png" width="200" />
  </a>

  <a href="https://postimg.cc/QHfSF5hx" target="_blank">
    <img src="https://i.postimg.cc/cLSz5MzY/Screenshot-20250602-180939.png" width="200" />
  </a>

  <a href="https://postimg.cc/rDYWkNcx" target="_blank">
    <img src="https://i.postimg.cc/VNzFXKVG/Screenshot-20250602-181514.png" width="200" />
  </a>

  <a href="https://postimg.cc/2Vk2jTpK" target="_blank">
    <img src="https://i.postimg.cc/8PW3HnZN/Screenshot-20250602-181206.png" width="200" />
  </a>

  <a href="https://postimg.cc/bdHmjW5n" target="_blank">
    <img src="https://i.postimg.cc/qBWS2dX1/Screenshot-20250602-181242.png" width="200" />
  </a>

  <a href="https://postimg.cc/ZvcBDrV9" target="_blank">
    <img src="https://i.postimg.cc/3WMXN1GZ/Screenshot-20250602-181447.png" width="200" />
  </a>

</div>

---

## Features

- **Multi-Faculty Support**: Pre-configured curriculum for multiple faculties and degree programs
- **Pre-filled Subject Data**: Automatically populated subjects and credit values for each degree program and semester
- **Real-time GPA Calculation**: Instant calculation of semester-wise and cumulative GPA with animated counter display
- **Flexible Data Storage**: Dual persistence with local browser storage and optional Firebase cloud synchronization
- **User Authentication**: Optional Google authentication for cloud data backup and access across devices
- **Grade Management**: Full edit and update capability for previously entered grades and semesters with complete grade history preservation
- **Analytics Dashboard**: Visual GPA progress tracking with interactive charts and performance trends
- **Responsive Design**: Mobile-first interface optimized for all device sizes and screen orientations
- **Theme Support**: Light and dark mode with automatic system preference detection
- **Data Import**: Ability to import from JSON files for data portability
- **Accessibility**: Full ARIA compliance and keyboard navigation support
- **Legacy Data Migration**: Automatic conversion and compatibility for older data formats

---

## Recent Updates

### Version 4.0 - Custom Degree Builder, Collaborative Catalog, and Moderation Engine

- **Visual Custom Degree Creator**: Fully interactive, visual degree and curriculum builder with drag-and-drop-like ease.
- **Preloaded Catalog Auto-Population**: Instantly load and import any preloaded university degree program to append missing semesters, custom subjects, or edit details.
- **Global Public Suggestion Engine**: Integrated collaborative workflow allowing users to toggle "Suggest for Public Database" and submit their curriculum suggestions.
- **Admin Moderation Console**: Comprehensive visual moderation center for administrators to review, inspect, approve, reject with feedback, or safely delete public curriculum suggestions.
- **Flawless UI & Mobile UX Optimizations**: Cleaned up mobile viewport constraints (side-by-side suggest toggle, scrollbar-free authorization modals) and introduced exact numerical ascending sorting (1, 2, 3... 8) for custom semesters and database dropdown lists.

### Version 3.0 - Cloud Integration and Enhanced Analytics

- Firebase Firestore integration for cloud-based data synchronization
- Real-time data loading and persistence across browser sessions and devices
- Analytics infrastructure with GPA progress visualization
- Enhanced migration system for data format updates
- Improved error handling and user feedback system
- Clean UI and better UX

### Performance and Architecture Improvements

- TypeScript strict mode enforcement for enhanced type safety
- Code splitting and lazy loading for optimized bundle size
- Page transition animations and smooth user experience
- Comprehensive error handling and recovery mechanisms
- Accessibility compliance with ARIA standards and keyboard navigation

---

## Technology Stack

- **Runtime and Build**: React 19, TypeScript, Vite
- **Styling and Components**: Tailwind CSS, shadcn/ui component library, Lucide React icons
- **State Management**: React hooks with localStorage for client-side persistence and React Context for theme management
- **Backend Integration**: Firebase Authentication (Google OAuth), Firestore for cloud data synchronization
- **Animations and Interactions**: Framer Motion for page transitions, React CountUp for numeric animations, Recharts for data visualization
- **Routing**: React Router DOM v7 with SPA support
- **Build Optimization**: Vite with code splitting by dependency (vendor, animations, UI, router, utilities)
- **Deployment and Analytics**: Vercel hosting with Vercel Analytics integration
- **Development Tools**: ESLint for code quality, TypeScript strict mode for type safety

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Git for version control

### Installation and Setup

```bash
# Clone the repository
git clone https://github.com/itswijay/gpa-cal.git
cd gpa-cal

# Install project dependencies
npm install

# Start the development server with network access
npm run dev

# Build for production deployment
npm run build

# Preview the production build locally
npm run preview
```

### Development Workflow

```bash
# Run development server with host access (for mobile device testing)
npm run dev -- --host

# Execute linting checks
npm run lint

# Perform type checking without compilation
npx tsc --noEmit
```

### Environment Configuration

Create a `.env.local` file in the project root with Firebase configuration:

```env
VITE_FIREBASE_API_KEY=api_key
VITE_FIREBASE_AUTH_DOMAIN=auth_domain
VITE_FIREBASE_PROJECT_ID=project_id
VITE_FIREBASE_STORAGE_BUCKET=storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=messaging_sender_id
VITE_FIREBASE_APP_ID=app_id
```

Refer to `.env.example` for the complete template.

---

## Usage Guide

### Adding a New Semester

1. Navigate to the grade entry page
2. Select your faculty from the dropdown menu
3. Choose your degree program
4. Select the semester to add
5. Enter grades for each subject
6. Select elective courses if applicable
7. Submit to save and automatically calculate GPA

### Managing Existing Semesters

1. View your GPA summary on the main page
2. Locate the semester you wish to modify
3. Click the edit button next to the semester entry
4. Update grades as needed
5. Save changes to recalculate cumulative GPA

### Data Management Options

- **Local Storage**: Data persists automatically in your browser
- **Cloud Backup**: Sign in with Google to sync data across devices using Firebase
- **Export Records**: Access browser developer tools to backup localStorage data
- **Clear All Data**: Use the clear button with confirmation to remove all stored information
- **Import Data**: Load previously exported JSON records to restore academic history

### Theme Customization

- Toggle between light and dark themes using the theme button
- System preference detection automatically applies your device settings
- Your theme selection is remembered across sessions

---

## Architecture Overview

### Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── ui/                 # shadcn/ui component library
│   ├── auth/               # Authentication-related components
│   ├── analytics/          # Analytics and charting components
│   ├── theme-provider.tsx  # Theme context and provider
│   ├── HowToUseDialog.tsx  # User guidance component
│   └── [other components]
├── pages/                  # Route-level page components
│   ├── MainPage.tsx        # GPA summary dashboard
│   ├── addGrades.tsx       # Grade entry and editing interface
│   └── LoginPage.tsx       # Authentication page
├── contexts/               # React context providers
│   └── AuthContext.tsx     # Authentication state management
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts          # Authentication hook
│   ├── useFirebaseData.ts  # Firebase data synchronization
│   ├── useFileImport.ts    # File import utilities
│   └── [other hooks]
├── firebase/               # Firebase configuration and utilities
│   ├── config.ts           # Firebase initialization
│   └── firestore.ts        # Firestore database operations
├── data/                   # Static data and configuration
│   ├── subjects/           # Modular curriculum by faculty
│   │   ├── computing.ts
│   │   ├── appliedSciences.ts
│   │   ├── managementStudies.ts
│   │   ├── agriculturalSciences.ts
│   │   └── index.ts
│   ├── types.ts            # TypeScript type definitions
│   └── grading.ts          # Grade to point mapping system
├── lib/                    # Utility functions
│   └── utils.ts
├── App.tsx                 # Main application component
├── main.tsx                # Application entry point
└── index.css               # Global styles
```

### Data Flow Architecture

1. **Data Retrieval**: Subject curriculum loaded from modular data files
2. **User Input**: Grade selection captured in addGrades page component
3. **Calculation Engine**: Real-time GPA calculation with validation
4. **Local Persistence**: Data stored in browser localStorage with versioning
5. **Cloud Synchronization**: Optional Firebase Firestore sync for authenticated users
6. **Display Layer**: Summary visualization with animations in MainPage
7. **Analytics**: Historical data aggregation and trend analysis

### State Management Strategy

- **Component State**: React hooks (useState, useEffect) for local component state
- **Persistent State**: localStorage for offline-first architecture
- **Theme State**: Context API for global theme management
- **Authentication State**: Custom useAuth hook with Firebase integration
- **Remote State**: useFirebaseData hook for cloud data synchronization
- **Router State**: React Router for navigation state management

---

## Customization Guide

### Adding New Grading Systems

Edit `src/data/grading.ts` to customize grade options and their point values. The file contains:

```typescript
{
  grade: 'A+',
  point: 4.0,
  percentage: '90-100'
}
```

### Extending Faculty and Degree Programs

Adding or updating university curricula is now completely **visual and code-free**! You do not need to edit any TypeScript files:

1. Sign in to your account.
2. Navigate to the **Custom Degree Creator** page.
3. Select or create your University, Faculty, and Degree.
4. Auto-populate existing preloaded semesters or add new ones dynamically.
5. Toggle **"Suggest for Public Curricula"** to submit it to administrators.
6. Once approved in the Moderation Console, your curriculum will instantly be available globally for all students!

---

## Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy to staging environment
vercel

# Deploy to production
vercel --prod
```

The application includes `vercel.json` configuration for proper SPA routing.

### Manual Deployment to Other Platforms

```bash
# Build the application
npm run build

# Upload the contents of the dist/ directory to your hosting provider
```

---

## Contributing

We welcome contributions to improve the GPA Calculator! We support two types of contributions:

1. **Curriculum Additions / Updates (No Code Required):**
   * If you want to add a new university, faculty, degree program, or missing semesters, please do it directly inside the app using the **Custom Degree Creator** page and toggling **"Suggest for Public Curricula"**!
2. **Codebase Improvements (For Developers):**
   * Review our [Contributing Guidelines](./CONTRIBUTING.md) for environment setup, code standards, and PR workflows.

### Quick Start for Developers

1. Fork the repository on GitHub
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make changes and test thoroughly
4. Commit with descriptive messages: `git commit -m "feat: description of changes"`
5. Push to your fork: `git push origin feature/your-feature-name`
6. Open a Pull Request with a clear description

---

## Support and Resources

- Review the [Contributing Guide](./CONTRIBUTING.md) for detailed development documentation
- Check [Testing Guide](./TESTING.md) for quality assurance procedures
- Visit the [GitHub Repository](https://github.com/itswijay/gpa-cal) for issue tracking
- Review commit history for implementation details and feature evolution

---

## License

This project is maintained by the GPA Calculator community. For license information, please refer to the repository.

---

## Project Status

**Current Version**: 4.0  
**Development Status**: Active  
**Last Updated**: May 2026

This application is actively maintained with regular feature updates and bug fixes. The development roadmap includes additional faculty integrations, enhanced analytics capabilities, and expanded institutional support.
