'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Database, Copy, ExternalLink } from 'lucide-react';

export default function SetupDatabasePage() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'needs-setup'>('idle');
  const [message, setMessage] = useState('');

  const sqlMigration = `-- Create companies table (if not exists)
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

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE leadlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for development)
CREATE POLICY "Allow all access to companies" ON companies
  FOR ALL USING (true);

CREATE POLICY "Allow all access to leadlists" ON leadlists
  FOR ALL USING (true);

CREATE POLICY "Allow all access to leads" ON leads
  FOR ALL USING (true);`;

  const checkDatabase = async () => {
    setStatus('checking');
    try {
      const response = await fetch('/api/leadlists');
      const data = await response.json();
      
      if (data.supabaseDisabled) {
        setStatus('needs-setup');
        setMessage('Database tables are not set up yet. Please follow the instructions below.');
      } else if (data.ok) {
        setStatus('success');
        setMessage('Database is properly configured and ready to use!');
      } else {
        setStatus('needs-setup');
        setMessage('Database connection issue. Please check your configuration.');
      }
    } catch (error) {
      setStatus('needs-setup');
      setMessage('Could not connect to the database. Please check your Supabase configuration.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlMigration);
    alert('SQL copied to clipboard!');
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sqlEditorUrl = supabaseUrl 
    ? `${supabaseUrl.replace('.supabase.co', '.supabase.com')}/project/default/sql`
    : 'https://supabase.com/dashboard/project/_/sql';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              Supabase Database Setup
            </CardTitle>
            <CardDescription>
              Set up your database tables for storing leads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkDatabase} disabled={status === 'checking'}>
              {status === 'checking' ? 'Checking...' : 'Check Database Status'}
            </Button>

            {status === 'success' && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {status === 'needs-setup' && (
              <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                <XCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle>Setup Required</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {status === 'needs-setup' && (
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
              <CardDescription>
                Follow these steps to create the necessary database tables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Step 1: Open Supabase SQL Editor</h3>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open(sqlEditorUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Supabase SQL Editor
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Step 2: Copy the SQL Migration</h3>
                <div className="relative">
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
                    {sqlMigration}
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2 gap-2"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-3 w-3" />
                    Copy SQL
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Step 3: Run the Migration</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Paste the SQL code in the Supabase SQL Editor</li>
                  <li>Click the "Run" button to execute the migration</li>
                  <li>Wait for the success message</li>
                  <li>Come back here and click "Check Database Status" again</li>
                </ol>
              </div>

              <Alert>
                <AlertDescription>
                  After running the migration, your database will have:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><code>companies</code> table for organizing leads</li>
                    <li><code>leadlists</code> table for grouping leads</li>
                    <li><code>leads</code> table for storing individual leads</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
