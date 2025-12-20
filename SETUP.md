# Setup Guide

This guide will walk you through setting up the JAM Stack Application from scratch.

## Choose Your Setup Method

You have two options for running Supabase:

### Option A: Local Development with Docker (Recommended for beginners)
- ✅ Everything runs locally on your machine
- ✅ No cloud account needed
- ✅ Faster setup
- ✅ Includes Supabase Studio UI at http://localhost:3001
- ✅ Perfect for development and testing
- ❌ Not suitable for production deployment

**Go to: [Local Docker Setup](#local-docker-setup)**

### Option B: Supabase Cloud (Recommended for production)
- ✅ Managed hosting (no infrastructure management)
- ✅ Automatic backups and updates
- ✅ Production-ready with CDN
- ✅ Free tier available
- ❌ Requires internet connection
- ❌ Slightly more complex initial setup

**Go to: [Cloud Setup](#cloud-setup)**

---

## Local Docker Setup

This method runs the entire stack (Next.js + Supabase) locally using Docker.

### Prerequisites

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Ensure Docker is running

### Quick Start

1. **Copy the local environment template:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Start all services:**
   ```bash
   docker-compose -f docker-compose.local.yml up
   ```

   This will start:
   - PostgreSQL database on port `5432`
   - Supabase Studio (Web UI) on port `3001`
   - Supabase API Gateway on port `8000`
   - Next.js application on port `3000`

3. **Wait for services to be healthy:**
   - First run takes 2-5 minutes to pull images and start services
   - Watch the logs for "ready" messages from each service

4. **Access the application:**
   - **Next.js App**: http://localhost:3000
   - **Supabase Studio**: http://localhost:3001
   - **Supabase API**: http://localhost:8000

### Run Migrations in Docker

The migrations will automatically run when the database first starts. If you need to re-run them:

**Option 1: Using Supabase Studio (Recommended)**

1. Open http://localhost:3001
2. Navigate to **SQL Editor**
3. Copy and paste each migration file content from `supabase/migrations/` in order:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_indexes.sql`
   - `004_functions.sql`
4. Click **RUN** for each migration

**Option 2: Using Docker exec**

```bash
# Connect to the database container
docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/001_initial_schema.sql
docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/002_rls_policies.sql
docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/003_indexes.sql
docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/004_functions.sql
```

### Verify Local Setup

1. Open Supabase Studio at http://localhost:3001
2. Check the **Table Editor** - you should see all tables
3. Try the Next.js app at http://localhost:3000

### Stopping and Restarting

```bash
# Stop all services (keeps data)
docker-compose -f docker-compose.local.yml down

# Stop and remove all data (fresh start)
docker-compose -f docker-compose.local.yml down -v

# View logs
docker-compose -f docker-compose.local.yml logs -f

# Restart specific service
docker-compose -f docker-compose.local.yml restart app
```

### Local Docker Troubleshooting

**Services won't start:**
```bash
# Check Docker is running
docker ps

# Check for port conflicts
lsof -i :3000  # Next.js
lsof -i :3001  # Studio
lsof -i :8000  # Supabase API
lsof -i :5432  # PostgreSQL

# View service status
docker-compose -f docker-compose.local.yml ps
```

**Database connection errors:**
```bash
# Check database is healthy
docker exec -it supabase-db pg_isready -U postgres

# View database logs
docker logs supabase-db
```

**Reset everything:**
```bash
# Nuclear option - removes all containers and volumes
docker-compose -f docker-compose.local.yml down -v
docker system prune -a --volumes
```

---

## Cloud Setup

### Step 1: Supabase Project Setup

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account)
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `jam-stack-app` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select closest to your users
   - **Pricing Plan**: Free tier is sufficient for development
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be provisioned

### Get Your API Credentials

1. Once the project is ready, go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the left sidebar
3. You'll see:
   - **Project URL**: Copy this (e.g., `https://xxxxx.supabase.co`)
   - **Project API keys**:
     - `anon` `public` key: Copy this (safe to use in browser)
     - `service_role` key: Copy this (keep secret, server-side only)

### Configure Environment Variables

1. In your project root, copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Step 2: Run Database Migrations

### Method 1: Using Supabase Dashboard (Recommended for beginners)

1. In Supabase Dashboard, click **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Open `supabase/migrations/001_initial_schema.sql` in your code editor
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **"Run"** (or press `Cmd/Ctrl + Enter`)
7. You should see "Success. No rows returned"

8. Repeat for the remaining migration files **in order**:
   - `002_rls_policies.sql`
   - `003_indexes.sql`
   - `004_functions.sql`

### Method 2: Using Supabase CLI (Advanced)

If you have the Supabase CLI installed:

```bash
# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Verify Migrations

1. Go to **Table Editor** in the Supabase Dashboard
2. You should see all tables:
   - profiles
   - login_history
   - active_sessions
   - todo_lists
   - todos
   - transaction_categories
   - transactions
   - recurring_transactions
   - transaction_reminders

## Step 3: Configure Authentication

### Email/Password Authentication

Email authentication is enabled by default in Supabase.

**Optional: Customize Email Templates**

1. Go to **Authentication** > **Email Templates**
2. Customize the templates for:
   - Confirm signup
   - Magic Link
   - Reset Password
   - Email Change

### Enable OAuth Providers (Optional)

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth client ID**
5. Configure OAuth consent screen if prompted
6. Choose **Web application**
7. Add authorized redirect URIs:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
8. Copy the **Client ID** and **Client Secret**
9. In Supabase Dashboard:
   - Go to **Authentication** > **Providers**
   - Find **Google** and toggle it on
   - Paste your Client ID and Client Secret
   - Save

#### GitHub OAuth

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** > **New OAuth App**
3. Fill in the details:
   - **Application name**: JAM Stack App
   - **Homepage URL**: `http://localhost:3000` (or your domain)
   - **Authorization callback URL**: `https://your-project.supabase.co/auth/v1/callback`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it
7. In Supabase Dashboard:
   - Go to **Authentication** > **Providers**
   - Find **GitHub** and toggle it on
   - Paste your Client ID and Client Secret
   - Save

## Step 4: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 5: Test the Setup

1. You should see the default Next.js page
2. Try accessing `/dashboard` - you should be redirected to `/login` (middleware working)
3. The app is ready for development!

## Next Steps

Now that the foundation is set up, you can start building:

1. **Phase 2**: Authentication pages (login, signup, OAuth)
2. **Phase 3**: Dashboard layout and navigation
3. **Phase 4**: Todo system
4. **Phase 5-6**: Fundflow tracker
5. **Phase 7**: Recurring transactions and reminders

Refer to `README.md` for the complete roadmap.

## Troubleshooting

### "Invalid API key" error

- Check that your `.env.local` file has the correct credentials
- Restart the dev server after changing `.env.local`
- Make sure you're using the `anon` key, not the `service_role` key for NEXT_PUBLIC_SUPABASE_ANON_KEY

### Migration errors

- Run migrations in order (001, 002, 003, 004)
- Check for syntax errors in the SQL
- Verify you have the correct permissions in Supabase

### OAuth not working

- Check redirect URLs match exactly
- Verify OAuth apps are approved (Google may require verification for production)
- Check browser console for errors

### Module not found errors

- Run `npm install` to ensure all dependencies are installed
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

## Useful Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

## Database Management

### Viewing Data

Use the **Table Editor** in Supabase Dashboard to view and edit data.

### Backing Up Data

1. Go to **Database** > **Backups** in Supabase Dashboard
2. Enable automatic backups (recommended for production)
3. You can also export data using the **SQL Editor**:
   ```sql
   COPY (SELECT * FROM todos) TO STDOUT WITH CSV HEADER;
   ```

### Resetting Database

**Warning: This will delete all data!**

```sql
-- Run in SQL Editor to drop all tables
DROP TABLE IF EXISTS transaction_reminders CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS recurring_transactions CASCADE;
DROP TABLE IF EXISTS transaction_categories CASCADE;
DROP TABLE IF EXISTS todos CASCADE;
DROP TABLE IF EXISTS todo_lists CASCADE;
DROP TABLE IF EXISTS active_sessions CASCADE;
DROP TABLE IF EXISTS login_history CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Then re-run all migrations
```

## Production Deployment

See the deployment section in `README.md` for instructions on deploying to Vercel.

## Support

For issues or questions:
- Check the [Next.js documentation](https://nextjs.org/docs)
- Check the [Supabase documentation](https://supabase.com/docs)
- Review the implementation plan in `.claude/plans/vast-twirling-stream.md`
