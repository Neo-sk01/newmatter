# Supabase Setup for Sales Matter AI

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new Supabase project

## Configuration Steps

### 1. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy your project URL and anon key

### 2. Add Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Database Migration

Option A: Using Supabase SQL Editor (Recommended)
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20240101_create_leads_tables.sql`
4. Click "Run" to execute the migration

Option B: Using Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

### 4. Verify Setup

1. Restart your development server: `npm run dev`
2. Try importing a CSV file with leads
3. Check your Supabase dashboard to see if the data is being stored

## Database Schema

The migration creates the following tables:

- **companies**: Stores company information
- **leadlists**: Stores collections of leads (like folders)
- **leads**: Stores individual lead information

## Features

- Automatic lead storage in Supabase when importing CSV files
- Persistent storage across sessions
- Real-time sync capabilities (can be added)
- Scalable database solution

## Troubleshooting

If you see "Lead storage tables are not provisioned yet":
1. Make sure you've run the migration
2. Check that your Supabase credentials are correct in `.env.local`
3. Verify the tables exist in your Supabase dashboard (Table Editor)

If leads disappear after import:
1. Check browser console for errors
2. Verify Supabase connection is working
3. Check the Network tab to see if API calls to `/api/leadlists` are succeeding
