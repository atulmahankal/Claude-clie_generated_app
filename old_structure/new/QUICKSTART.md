# Quick Start Guide

Get up and running with the frontend base in 5 minutes.

## 1. Installation (2 minutes)

```bash
# Navigate to the project
cd new/base_frontend

# Install dependencies
npm install
```

## 2. Environment Setup (1 minute)

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local (optional - defaults work for local development)
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 3. Run Development Server (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 4. Explore the Pages (1 minute)

Visit these pages to see the features:

- **Welcome Page**: http://localhost:3000
- **Login**: http://localhost:3000/auth/login
- **Register**: http://localhost:3000/auth/register (Try the password generator!)
- **Forgot Password**: http://localhost:3000/auth/forgot-password
- **Profile**: http://localhost:3000/auth/profile (Edit profile & change password)
- **Dashboard**: http://localhost:3000/dashboard

## 5. Test Features (30 seconds)

### Password Generator
1. Go to Register page
2. Click "Generate Password" button
3. See a strong password auto-filled with strength indicator

### Password Strength Indicator
1. Type any password in the password field
2. Watch the strength bar change colors:
   - Red = Very Weak/Weak
   - Orange = Fair
   - Yellow = Good
   - Green = Strong

### Change Password
1. Go to Profile page (http://localhost:3000/auth/profile)
2. Click "Change Password" tab
3. Fill in passwords and see validation

## Next Steps

### Integrate with Your Backend

1. **Update API calls** in auth pages:
   ```typescript
   // Find TODO comments in:
   // - src/app/auth/login/page.tsx
   // - src/app/auth/register/page.tsx
   // - src/app/auth/forgot-password/page.tsx
   // - src/app/auth/profile/page.tsx
   ```

2. **Use the API client**:
   ```typescript
   // Import the API client
   import { api } from '@/lib/api'

   // Replace fetch calls with:
   const response = await api.auth.login({ email, password })
   ```

3. **Update API URL** in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-api.com
   ```

### Customize Branding

1. **Update app name** in `.env.local`:
   ```env
   NEXT_PUBLIC_APP_NAME=Your App Name
   ```

2. **Change colors** in `tailwind.config.js`:
   ```javascript
   colors: {
     primary: {
       600: '#your-brand-color',
     },
   }
   ```

3. **Replace logo** in page headers:
   ```tsx
   // Change this div to your logo image
   <div className="w-8 h-8 bg-primary-600 rounded-lg"></div>
   ```

## Common Tasks

### Add a new page
```bash
mkdir -p src/app/new-page
touch src/app/new-page/page.tsx
```

### Add a new component
```bash
touch src/components/ui/NewComponent.tsx
```

### Build for production
```bash
npm run build
npm start
```

## Troubleshooting

### Port 3000 already in use
```bash
# Run on a different port
PORT=3001 npm run dev
```

### Dependencies not installing
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
# Check for type errors
npm run build
```

## Documentation

- **Full Documentation**: See [README.md](./README.md)
- **Auth Guide**: See [auth_frontend/README.md](../auth_frontend/README.md)
- **Tech Stack Details**: See [README.md](./README.md#-tech-stack)

## Features Checklist

- ✅ Welcome/landing page with hero section
- ✅ User registration with validation
- ✅ Password generator (one-click)
- ✅ Password strength indicator (real-time)
- ✅ Login with email/password
- ✅ Forgot password flow
- ✅ Profile edit (name, email, phone)
- ✅ Change password with validation
- ✅ Show/hide password toggles
- ✅ Form validation and error messages
- ✅ Success notifications
- ✅ Responsive design
- ✅ TypeScript support
- ✅ Tailwind CSS styling

---

**You're ready to go! Start building your application.**
