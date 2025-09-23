import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = await createClient();
    
    // SQL to create all necessary tables
    const setupSQL = `
      -- Create companies table (if not exists)
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Insert a mock company for development
      INSERT INTO companies (id, name) 
      VALUES ('00000000-0000-0000-0000-000000000001', 'Default Company')
      ON CONFLICT (id) DO NOTHING;

      -- Create leadlists table
      CREATE TABLE IF NOT EXISTS leadlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        source TEXT,
        tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create leads table
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        leadlist_id UUID NOT NULL REFERENCES leadlists(id) ON DELETE CASCADE,
        first_name TEXT,
        last_name TEXT,
        company TEXT,
        email TEXT,
        title TEXT,
        website TEXT,
        linkedin TEXT,
        status TEXT DEFAULT 'new',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_leadlists_company_id ON leadlists(company_id);
      CREATE INDEX IF NOT EXISTS idx_leads_leadlist_id ON leads(leadlist_id);
      CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    `;

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: setupSQL }).single();
    
    if (error) {
      // If the RPC function doesn't exist, return instructions
      if (error.message?.includes('function') || error.code === 'PGRST202') {
        return NextResponse.json({
          success: false,
          message: 'Database setup required',
          instructions: 'Please run the SQL migration manually in your Supabase SQL Editor',
          sqlFile: '/supabase/migrations/20240101_create_leads_tables.sql'
        });
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database tables created successfully' 
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to setup database',
      instructions: 'Please run the SQL migration manually in your Supabase SQL Editor',
      sqlFile: '/supabase/migrations/20240101_create_leads_tables.sql'
    }, { status: 500 });
  }
}
