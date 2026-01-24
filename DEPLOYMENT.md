# Deployment Guide - Vercel + Supabase

This guide will help you deploy the AI Chat Platform to production using Vercel (for the Next.js app) and Supabase (for PostgreSQL database).

## Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- Supabase account (sign up at https://supabase.com)

## Part 1: Setup Supabase Database (Already Done ✅)

You've already created your Supabase project. Now we need to apply the database schema.

### Apply Database Schema

1. **Option A: Using Supabase SQL Editor (Recommended)**

   Go to your Supabase dashboard:
   - Project: https://supabase.com/dashboard/project/vwysdvxxyyyvertzvela
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"
   - Copy the contents of `packages/database/drizzle/0000_wooden_mephisto.sql`
   - Paste into the SQL editor
   - Click "Run" button

2. **Option B: Using Drizzle Kit Push**

   ```bash
   # Set your database URL
   export DATABASE_URL="postgresql://postgres:NBjfdfhd783hjhfbHgfdjallkjkkj@db.vwysdvxxyyyvertzvela.supabase.co:5432/postgres"

   # Push schema to database
   cd packages/database
   pnpm drizzle-kit push
   ```

3. **Verify Tables Created**

   In Supabase Dashboard → Table Editor, you should see:
   - `users` table
   - `chats` table
   - `messages` table

## Part 2: Deploy to Vercel

### Step 1: Connect GitHub Repository

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your repository: `privatych/ai-chat-platform`
4. Click "Import"

### Step 2: Configure Build Settings

Vercel should auto-detect Next.js. If not, set:

- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `cd ../.. && pnpm build --filter=web`
- **Output Directory**: Leave as default (`.next`)
- **Install Command**: `pnpm install`

### Step 3: Add Environment Variables

Click "Environment Variables" and add the following:

#### Required Variables:

```bash
# Database (from Supabase)
DATABASE_URL
postgresql://postgres:NBjfdfhd783hjhfbHgfdjallkjkkj@db.vwysdvxxyyyvertzvela.supabase.co:5432/postgres

# JWT Secret (generate a random 32+ character string)
JWT_SECRET
your-random-secret-key-min-32-characters-long

# App URL (will be auto-filled after first deploy)
NEXT_PUBLIC_APP_URL
https://your-app-name.vercel.app
```

#### Optional Variables:

```bash
# OpenRouter API Key (if you have one)
OPENROUTER_API_KEY
sk-or-v1-your-api-key-here
```

**Important**: For `NEXT_PUBLIC_APP_URL`, you can temporarily put a placeholder. After the first deployment, Vercel will give you a URL like `https://ai-chat-platform-xxx.vercel.app`. Come back and update this variable with the real URL.

### Step 4: Deploy

1. Click "Deploy" button
2. Wait 2-3 minutes for the build to complete
3. Vercel will give you a URL like `https://ai-chat-platform-xxx.vercel.app`

### Step 5: Update Environment Variables

1. Go to your Vercel project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
3. Click "Save"
4. Redeploy (Deployments → Latest → ⋮ → Redeploy)

## Part 3: Verify Deployment

### Test the Application

1. **Visit your Vercel URL**
   - Should see the landing page

2. **Test Registration**
   - Click "Register" or "Get Started"
   - Create a test account
   - Should see chat interface

3. **Test Chat**
   - Try sending a message
   - Without OpenRouter API key, you'll get mock responses
   - With API key, real AI responses

4. **Check Database**
   - Go to Supabase → Table Editor
   - Check `users` table → should see your test user
   - Check `chats` table → should see created chats
   - Check `messages` table → should see messages

## Part 4: Custom Domain (Optional)

### Add Your Own Domain

1. Go to Vercel Project → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `chat.yourdomain.com`)
4. Follow DNS configuration instructions
5. Update `NEXT_PUBLIC_APP_URL` environment variable

## Part 5: Continuous Deployment

### Automatic Deploys

Now every time you push to GitHub:
- Push to `main` → deploys to production
- Push to `develop` → creates preview deployment
- Create PR → creates preview deployment with unique URL

### Deploy from CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

## Troubleshooting

### Build Fails

**Error**: `DATABASE_URL environment variable is not set`
- **Fix**: Add `DATABASE_URL` in Vercel Environment Variables

**Error**: `TypeScript build errors`
- **Fix**: Temporarily disabled in `next.config.js`. To fix properly:
  1. Fix TypeScript errors in codebase
  2. Remove `typescript.ignoreBuildErrors = true`
  3. Redeploy

### Database Connection Issues

**Error**: `getaddrinfo ENOTFOUND`
- **Fix**: Verify DATABASE_URL is correct
- Check Supabase project is not paused
- Verify password is correct

**Error**: `relation "users" does not exist`
- **Fix**: Run the SQL migration in Supabase SQL Editor

### Runtime Errors

**Error**: `OpenRouter API error`
- Without API key: App uses mock responses (expected)
- With API key: Verify key is valid at https://openrouter.ai/keys

## Environment Variables Reference

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | `postgresql://postgres:...@db....supabase.co:5432/postgres` | Supabase PostgreSQL connection string |
| `JWT_SECRET` | ✅ Yes | `random-32-character-string` | Secret for JWT token signing |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | `https://your-app.vercel.app` | Your deployed app URL |
| `OPENROUTER_API_KEY` | ❌ No | `sk-or-v1-...` | OpenRouter API key (uses mock if not set) |

## Monitoring & Analytics

### Vercel Analytics

1. Go to Project → Analytics
2. View real-time traffic, performance metrics
3. Free tier: 100k events/month

### Supabase Monitoring

1. Go to Supabase Dashboard → Database
2. View connections, query performance
3. Set up alerts for database size

## Costs

### Free Tiers:

- **Vercel**: Unlimited deployments, 100GB bandwidth/month
- **Supabase**: 500MB database, 2GB bandwidth, 50MB file storage

### When You'll Need to Upgrade:

- **Vercel Pro ($20/month)**: >100GB bandwidth, team features
- **Supabase Pro ($25/month)**: >500MB database, daily backups

## Next Steps

1. ✅ Database schema applied
2. ✅ Deployed to Vercel
3. 🔄 Add OpenRouter API key for real AI responses
4. 🔄 Configure custom domain
5. 🔄 Set up monitoring/alerts
6. 🔄 Enable automatic backups in Supabase

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Project Issues**: https://github.com/privatych/ai-chat-platform/issues
