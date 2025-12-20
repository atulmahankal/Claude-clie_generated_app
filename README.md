# JAM Stack Application

A full-stack web application built with Next.js 14, Supabase, and Tailwind CSS featuring authentication, todo management, and financial tracking.

## Features

### Authentication
- Email/Password signup & login
- Social login (Google/GitHub OAuth)
- Password reset flow
- Profile management
- Two-factor authentication (2FA)
- Session control (view and logout from devices)
- Login history tracking

### Todo Management
- Create, read, update, delete todos
- Organize todos in lists
- Priority levels (low, medium, high, urgent)
- Due dates
- Real-time synchronization

### Fundflow Tracker
- Income & Expense transaction tracking
- Visual reports and charts
- Recurring transactions (bills, subscriptions)
- Reminders for upcoming payments
- Category management
- Financial dashboard

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Notifications**: Sonner

## Getting Started

You have two options for running this application:

### Option A: Docker Setup (Recommended for Quick Start)

Run the entire stack locally with Docker - no cloud setup required!

**Prerequisites:**
- Docker Desktop installed and running
- No Supabase account needed

**Quick Start:**
```bash
# Copy local environment template
cp .env.local.example .env.local

# Start all services (Next.js + Supabase stack)
docker-compose -f docker-compose.local.yml up
```

**Access:**
- Next.js App: http://localhost:3000
- Supabase Studio (Database UI): http://localhost:3001
- Supabase API: http://localhost:8000

See [SETUP.md](./SETUP.md#local-docker-setup) for detailed Docker instructions.

---

### Option B: Cloud Setup (Recommended for Production)

**Prerequisites:**
- Node.js 18+ and npm
- A Supabase account ([sign up here](https://supabase.com))

### 1. Clone and Install

```bash
# Dependencies are already installed
# If you need to reinstall:
npm install
```

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon key

### 3. Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env.local

# Edit .env.local and add your Supabase credentials:
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Database Migrations

In your Supabase dashboard, go to **SQL Editor** and run the migration files in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_indexes.sql`
4. `supabase/migrations/004_functions.sql`

### 5. Configure OAuth Providers (Optional)

To enable Google/GitHub login:

1. **Supabase Dashboard** > Authentication > Providers
2. Enable Google and/or GitHub
3. Follow the setup instructions for each provider
4. Add authorized redirect URLs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
jam-stack-app/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (auth)/         # Authentication pages
│   │   ├── (dashboard)/    # Protected dashboard pages
│   │   └── api/            # API routes
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── auth/          # Auth components
│   │   ├── todos/         # Todo components
│   │   └── fundflow/      # Fundflow components
│   ├── lib/
│   │   ├── supabase/      # Supabase client configs
│   │   ├── utils/         # Utility functions
│   │   └── hooks/         # Custom React hooks
│   └── types/             # TypeScript types
├── supabase/
│   └── migrations/        # Database migrations
├── middleware.ts          # Auth middleware
└── .env.local            # Environment variables
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Database Schema

The application uses the following main tables:

- `profiles` - User profiles (extends auth.users)
- `login_history` - Authentication history
- `active_sessions` - Active user sessions
- `todo_lists` - Todo list collections
- `todos` - Individual todo items
- `transaction_categories` - Income/expense categories
- `transactions` - Financial transactions
- `recurring_transactions` - Recurring bills/income
- `transaction_reminders` - Payment reminders

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## Security

- Row Level Security (RLS) policies on all tables
- Server-side validation with Zod
- Session management with automatic expiry
- CSRF protection with SameSite cookies
- 2FA support with TOTP
- Secure password requirements

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Configure Production Supabase

1. Update OAuth redirect URLs to include production domain
2. Enable database backups in Supabase dashboard
3. Review and test RLS policies
4. Set up monitoring and error tracking

## Development Roadmap

See the implementation plan at `.claude/plans/vast-twirling-stream.md` for detailed development phases.

### Current Status: Phase 1 Complete

✅ Project setup and foundation
- Next.js project initialized
- Dependencies installed
- Database migrations created
- Supabase clients configured
- Middleware implemented
- Utility functions created

### Next Steps: Phase 2 - Authentication

- Build login/signup pages
- Implement OAuth integration
- Create profile management
- Add 2FA setup
- Build session management

## Contributing

This is a personal project. Feel free to fork and customize for your own use.

## License

MIT
