# Auth Frontend Components

This directory contains reusable authentication components and pages that can be integrated into any Next.js application.

## Features

### Authentication Pages

1. **Login** (`/auth/login`)
   - Email/password authentication
   - Remember me functionality
   - Social login placeholders (Google, GitHub)
   - Forgot password link
   - Form validation with error messages

2. **Registration** (`/auth/register`)
   - User registration with email/password
   - **Password Generator** - One-click secure password generation
   - **Real-time Password Strength Indicator**
   - Show/hide password toggle
   - Confirm password validation
   - Terms of service agreement
   - Social signup placeholders

3. **Forgot Password** (`/auth/forgot-password`)
   - Email-based password reset flow
   - Success confirmation screen
   - Back to login navigation

4. **Profile Edit** (`/auth/profile`)
   - **Two-tab interface**: Profile Information & Change Password
   - Profile fields: First name, Last name, Email, Phone
   - **Change Password** with current password verification
   - Password strength indicator for new password
   - Show/hide passwords toggle
   - Form validation and success messages

## Password Generator

The password generator creates strong, random passwords with:
- 16 characters by default (configurable)
- Mix of uppercase, lowercase, numbers, and symbols
- At least one character from each category
- Randomized character order

### Usage

```typescript
import { generatePassword } from '@/lib/utils'

const password = generatePassword(16) // Returns a 16-character password
```

## Password Strength Checker

Evaluates password strength based on:
- Length (8+ characters, 12+ for bonus points)
- Uppercase and lowercase letters
- Numbers
- Special characters

Returns a score (0-4) with feedback:
- 0: Very Weak (red)
- 1: Weak (orange)
- 2: Fair (yellow)
- 3: Good (blue)
- 4: Strong (green)

### Usage

```typescript
import { checkPasswordStrength } from '@/lib/utils'

const strength = checkPasswordStrength('MyP@ssw0rd123')
// Returns: { score: 4, feedback: 'Strong', color: 'text-green-600' }
```

## Integration Guide

### 1. Copy Components

Copy the following files to your Next.js project:

```bash
# Auth pages
cp -r new/base_frontend/src/app/auth/* your-app/src/app/auth/

# UI components
cp -r new/base_frontend/src/components/ui/* your-app/src/components/ui/

# Utilities
cp new/base_frontend/src/lib/utils.ts your-app/src/lib/utils.ts

# Types
cp new/base_frontend/src/types/index.ts your-app/src/types/index.ts
```

### 2. Install Dependencies

```bash
npm install clsx tailwind-merge
```

### 3. Backend Integration

Replace the TODO comments in each auth page with your actual API calls:

```typescript
// Example: Login page
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})

const data = await response.json()
localStorage.setItem('token', data.token)
```

### 4. Update Routes

Ensure your backend supports these endpoints:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Send reset email
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

## Customization

### Styling

All components use Tailwind CSS with a customizable color scheme. Update `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your brand colors
        500: '#your-color',
        600: '#your-color',
        // ...
      },
    },
  },
}
```

### Validation Rules

Modify validation in each page:

```typescript
// Example: Custom password requirements
if (password.length < 12) {
  errors.password = 'Password must be at least 12 characters'
}
if (!/[A-Z].*[A-Z]/.test(password)) {
  errors.password = 'Password must contain at least 2 uppercase letters'
}
```

## File Structure

```
auth_frontend/
├── components/
│   └── (Auth-specific reusable components if needed)
├── README.md (this file)
└── (Copy from base_frontend/src/app/auth/*)
```

The actual auth pages are located in `base_frontend/src/app/auth/`:
- `login/page.tsx`
- `register/page.tsx`
- `forgot-password/page.tsx`
- `profile/page.tsx`

## Features Checklist

- [x] Login with email/password
- [x] Registration with validation
- [x] Password generator
- [x] Password strength indicator
- [x] Show/hide password toggle
- [x] Forgot password flow
- [x] Profile edit
- [x] Change password
- [x] Remember me
- [x] Form validation
- [x] Error handling
- [x] Success messages
- [x] Social login UI (placeholders)
- [x] Responsive design
- [x] TypeScript support

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
