'use client';

import { useState } from 'react';
import EnhancedCSVImporter from '@/components/EnhancedCSVImporter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  title: string;
  website?: string;
  linkedin?: string;
  phone?: string;
  location?: string;
  industry?: string;
  status: 'new' | 'enriched' | 'generated';
  customFields?: Record<string, unknown>;
  tags?: string[];
}

export default function CSVDemoPage() {
  const [importedLeads, setImportedLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleImportComplete = (leads: Lead[]) => {
    setImportedLeads(leads);
    setSuccess(`Successfully imported ${leads.length} leads!`);
    setError(null);
    
    // Auto-clear success message after 5 seconds
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Enhanced CSV Import Demo</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Experience AI-powered CSV parsing with intelligent column mapping and data validation
          </p>
        </div>

        {/* Status Messages */}
        {success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-500 bg-red-50 dark:bg-red-900/20">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* CSV Importer */}
        <EnhancedCSVImporter
          onImportComplete={handleImportComplete}
          onError={handleError}
        />

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🤖 AI-Powered Mapping</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Uses Vercel AI SDK with GPT-4 to intelligently map CSV columns to lead fields, 
                understanding variations in naming conventions and data formats.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">✅ Data Validation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Validates email addresses, normalizes URLs, detects duplicates, and provides 
                detailed quality metrics for your imported data.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Quality Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Generates AI-powered insights about your data quality, completeness, and 
                suggestions for improvement.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔧 Custom Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatically detects and preserves custom fields that don&apos;t fit standard 
                lead schema, ensuring no data is lost.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📈 Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Processes thousands of rows efficiently with detailed timing metrics and 
                progress tracking throughout the import process.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💾 Export Options</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Download processed data as clean JSON, ready for integration with your 
                CRM or other systems.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Sample Data Preview */}
        {importedLeads.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Imported Leads Preview</CardTitle>
              <CardDescription>
                Showing first 5 leads from your import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Company</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Title</th>
                      <th className="text-left p-2">Custom Fields</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedLeads.slice(0, 5).map((lead, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">
                          {[lead.firstName, lead.lastName].filter(Boolean).join(' ') || '-'}
                        </td>
                        <td className="p-2">{lead.company || '-'}</td>
                        <td className="p-2">{lead.email || '-'}</td>
                        <td className="p-2">{lead.title || '-'}</td>
                        <td className="p-2">
                          {Object.keys(lead.customFields || {}).length > 0 
                            ? Object.keys(lead.customFields).join(', ')
                            : '-'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importedLeads.length > 5 && (
                  <p className="text-center text-gray-500 mt-4">
                    ... and {importedLeads.length - 5} more leads
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sample CSV Format */}
        <Card>
          <CardHeader>
            <CardTitle>Sample CSV Format</CardTitle>
            <CardDescription>
              Here&apos;s an example of what your CSV might look like. The AI will intelligently map these columns:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
{`First Name,Last Name,Company Name,Email Address,Job Title,Website,LinkedIn Profile
John,Doe,Acme Corp,john.doe@acme.com,CEO,acme.com,linkedin.com/in/johndoe
Jane,Smith,Tech Solutions,jane@techsolutions.com,CTO,https://techsolutions.com,https://linkedin.com/in/janesmith
Bob,Johnson,StartupXYZ,bob.johnson@startupxyz.io,Founder,,linkedin.com/in/bobjohnson`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
