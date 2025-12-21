# Reusable Frontend Base with Authentication

A modern, production-ready Next.js frontend template with complete authentication flow, built with TypeScript and Tailwind CSS. Ready to integrate with any backend API.

## 📁 Project Structure

```
new/
├── base_frontend/          # Main Next.js application
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   │   ├── auth/      # Authentication pages
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/
│   │   │   │   └── profile/
│   │   │   ├── dashboard/ # Protected dashboard
│   │   │   ├── page.tsx   # Welcome/landing page
│   │   │   ├── layout.tsx # Root layout
│   │   │   └── globals.css # Global styles
│   │   │
│   │   ├── components/
│   │   │   └── ui/        # Reusable UI components
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Card.tsx
│   │   │       └── Alert.tsx
│   │   │
│   │   ├── lib/
│   │   │   └── utils.ts   # Utility functions
│   │   │
│   │   └── types/
│   │       └── index.ts   # TypeScript definitions
│   │
│   ├── public/            # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   ├── .env.example
│   └── .gitignore
│
├── auth_frontend/         # Authentication documentation
│   └── README.md          # Auth integration guide
│
└── README.md              # This file
```

## 🚀 Tech Stack

### Core Framework
- **Next.js 15.1.3** - React framework with App Router
  - Server Components for improved performance
  - File-based routing
  - Built-in optimization (Image, Font, Script)
  - Turbopack for faster development

### Language
- **TypeScript 5.7.2** - Type-safe JavaScript
  - Strict mode enabled
  - Full type coverage for components and utilities
  - IntelliSense support

### Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
  - Custom color palette
  - Responsive design utilities
  - Dark mode support (configured)
  - PostCSS for processing

### UI Components
- **Custom Component Library**
  - Button with multiple variants (default, outline, ghost, destructive)
  - Input with validation and error states
  - Card components (Card, CardHeader, CardTitle, etc.)
  - Alert with multiple variants (success, error, warning, info)

### State Management
- **React 19** - Latest React with improved hooks
  - Client-side state with `useState`
  - Form handling with controlled components
  - No external state library (keep it simple for MVP)

### Utilities
- **clsx** - Conditional className utility
- **tailwind-merge** - Merge Tailwind classes without conflicts

### Development Tools
- **ESLint** - Code linting with Next.js config
- **Autoprefixer** - CSS vendor prefixing

## ✨ Features

### 🔐 Authentication System
1. **User Registration**
   - First name, last name, email, password fields
   - **One-click password generator** (16-char secure passwords)
   - **Real-time password strength indicator** (Visual feedback: Very Weak → Strong)
   - Show/hide password toggle
   - Confirm password validation
   - Terms of service checkbox

2. **User Login**
   - Email and password authentication
   - Remember me checkbox
   - Social login UI (Google, GitHub placeholders)
   - Error handling and validation

3. **Password Recovery**
   - Email-based reset flow
   - Success confirmation screen
   - Resend email functionality

4. **Profile Management**
   - Edit profile information (name, email, phone)
   - **Change password** with current password verification
   - Password strength indicator for new passwords
   - Show/hide passwords toggle
   - Tab-based interface (Profile / Password)

### 🎨 UI Components
- **Button** - 4 variants, 3 sizes, fully accessible
- **Input** - Labels, errors, helper text, validation states
- **Card** - Composable card components
- **Alert** - 5 variants for different message types

### 🛠️ Utility Functions
- `cn()` - Merge Tailwind classes intelligently
- `generatePassword()` - Generate strong random passwords
- `checkPasswordStrength()` - Evaluate password strength (0-4 score)
- `isValidEmail()` - Email format validation
- `formatDate()` - Date formatting helper

### 📱 Pages
1. **Welcome Page** (`/`)
   - Hero section with CTA
   - Features showcase
   - Responsive header/footer
   - Navigation to auth pages

2. **Dashboard** (`/dashboard`)
   - Protected route (placeholder)
   - Stats cards
   - Recent activity feed
   - Logout functionality

## 🏃 Quick Start

### 1. Installation

```bash
cd new/base_frontend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=My Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## 🔌 Backend Integration

### API Endpoints Required

The frontend expects these backend endpoints:

```typescript
// Authentication
POST   /api/auth/register           // User registration
POST   /api/auth/login              // User login
POST   /api/auth/forgot-password    // Send reset email
POST   /api/auth/reset-password     // Reset password with token

// User Profile
GET    /api/auth/profile            // Get current user
PUT    /api/auth/profile            // Update user profile
POST   /api/auth/change-password    // Change password
```

### Request/Response Examples

#### Register
```typescript
// Request
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecureP@ss123"
}

// Response
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "token": "jwt-token-here"
}
```

#### Login
```typescript
// Request
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecureP@ss123"
}

// Response
{
  "user": { ... },
  "token": "jwt-token-here"
}
```

### Integration Steps

1. **Update API URLs** in auth pages:
   ```typescript
   // Replace TODO comments with actual API calls
   const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email, password }),
   })
   ```

2. **Add Authentication Middleware**:
   ```typescript
   // Create src/middleware.ts for protected routes
   export function middleware(request: NextRequest) {
     const token = request.cookies.get('token')
     if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
       return NextResponse.redirect('/auth/login')
     }
   }
   ```

3. **Create API Client** (optional but recommended):
   ```typescript
   // src/lib/api.ts
   const api = {
     auth: {
       login: (credentials) => fetch('/api/auth/login', ...),
       register: (data) => fetch('/api/auth/register', ...),
       // ...
     }
   }
   ```

## 🎨 Customization

### Brand Colors

Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#eff6ff',   // Lightest
        500: '#3b82f6',  // Main brand color
        600: '#2563eb',  // Hover states
        900: '#1e3a8a',  // Darkest
      },
    },
  },
}
```

### Component Styles

All components accept `className` prop for custom styling:
```tsx
<Button className="bg-purple-600 hover:bg-purple-700">
  Custom Color
</Button>
```

### Password Requirements

Modify in `src/app/auth/register/page.tsx`:
```typescript
if (formData.password.length < 12) {
  newErrors.password = 'Password must be at least 12 characters'
}
```

## 📦 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
Set these in your deployment platform:
- `NEXT_PUBLIC_API_URL` - Your backend API URL
- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_PUBLIC_APP_URL` - Frontend URL

## 🧪 Development

### File Naming Conventions
- **Pages**: `page.tsx` (Next.js App Router convention)
- **Layouts**: `layout.tsx`
- **Components**: `PascalCase.tsx`
- **Utilities**: `camelCase.ts`

### Code Style
- Use TypeScript for all files
- Follow ESLint rules (`npm run lint`)
- Use functional components with hooks
- Prefer server components (default in App Router)
- Use client components only when needed (`'use client'`)

### Adding New Pages
```bash
# Create a new route
mkdir -p src/app/new-page
touch src/app/new-page/page.tsx
```

```tsx
// src/app/new-page/page.tsx
export default function NewPage() {
  return <div>New Page</div>
}
```

### Adding New Components
```bash
touch src/components/ui/NewComponent.tsx
```

```tsx
// src/components/ui/NewComponent.tsx
import { cn } from '@/lib/utils'

export interface NewComponentProps {
  className?: string
}

export function NewComponent({ className }: NewComponentProps) {
  return <div className={cn('...', className)}>Content</div>
}
```

## 📚 Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Design System
- Color scheme: CSS variables in `globals.css`
- Spacing: Tailwind's default spacing scale
- Typography: Inter font from Google Fonts

## 🤝 Contributing

This is a template project. Feel free to:
- Fork and modify for your needs
- Report issues or suggest improvements
- Use in commercial projects (no attribution required)

## 📄 License

MIT License - Use freely in personal and commercial projects.

## 🔮 Future Enhancements

- [ ] API client with interceptors
- [ ] React Query for data fetching
- [ ] Form library (React Hook Form)
- [ ] Toast notifications
- [ ] Loading states and skeletons
- [ ] Dark mode toggle
- [ ] Multi-language support (i18n)
- [ ] Social authentication integration
- [ ] Two-factor authentication
- [ ] Session management
- [ ] Protected route HOC
- [ ] Unit tests (Jest + React Testing Library)
- [ ] E2E tests (Playwright)

## 📞 Support

For questions or issues:
1. Check the `auth_frontend/README.md` for auth-specific docs
2. Review Next.js and Tailwind documentation
3. Search existing issues on GitHub
4. Create a new issue with detailed information

---

**Built with ❤️ using Next.js, React, TypeScript, and Tailwind CSS**
