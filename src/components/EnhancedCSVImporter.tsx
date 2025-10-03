'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Users, 
  Mail, 
  Building2,
  Clock,
  Download,
  Eye
} from 'lucide-react';
import Papa from 'papaparse';

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

interface ParsedResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  skippedRows: number;
  headerMapping: Record<string, string>;
  dataQuality: {
    emailValidation: {
      valid: number;
      invalid: number;
      missing: number;
    };
    completeness: {
      hasName: number;
      hasCompany: number;
      hasContact: number;
    };
    duplicates: number;
  };
  leads: Lead[];
  errors: Array<{
    row: number;
    field: string;
    value: unknown;
    error: string;
  }>;
  suggestions: string[];
  customFields: string[];
  processingTime: number;
  error?: string;
  fallbackRequired?: boolean;
}

interface EnhancedCSVImporterProps {
  onImportComplete: (leads: Lead[]) => void;
  onError: (error: string) => void;
}

export default function EnhancedCSVImporter({ onImportComplete, onError }: EnhancedCSVImporterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState<'upload' | 'processing' | 'results'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      onError('Please upload a CSV file');
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      // Parse CSV on client
      const parsed = await new Promise<Papa.ParseResult<Record<string, unknown>>>((resolve, reject) => {
        Papa.parse<Record<string, unknown>>(file, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h: string) => String(h || "").trim(),
          complete: resolve,
          error: reject,
        });
      });

      const rows = (parsed.data || []).filter((r) => r && Object.keys(r).length > 0);
      const columns = (parsed.meta.fields || []).filter(Boolean) as string[];

      if (!rows.length || !columns.length) {
        throw new Error('CSV file appears empty or missing headers');
      }

      // Send to enhanced parsing API
      console.log('Sending CSV data to /api/parse-csv', {
        columnCount: columns.length,
        rowCount: rows.length,
        columns: columns
      });

      const response = await fetch('/api/parse-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columns,
          rows,
          options: {
            skipEmptyRows: true,
            validateEmails: true,
            detectDuplicates: true,
            maxRows: 10000,
          }
        }),
      });

      console.log('API response status:', response.status, response.statusText);

      const parseResult: ParsedResult = await response.json();
      console.log('Parse result:', parseResult);
      
      // Check if we need to use fallback
      if (!response.ok || !parseResult.success || parseResult.fallbackRequired) {
        console.warn('Enhanced AI parsing unavailable, using fallback parser');
        
        // Use the fallback import from utils
        const { enhancedCSVImport } = await import('@/utils/enhancedCSVImport');
        const fallbackResult = await enhancedCSVImport(file);
        
        if (!fallbackResult.success) {
          throw new Error('Failed to parse CSV file');
        }
        
        // Convert fallback result to ParsedResult format
        setResult({
          success: true,
          totalRows: fallbackResult.totalRows,
          validRows: fallbackResult.validRows,
          skippedRows: fallbackResult.skippedRows,
          headerMapping: {}, // Fallback doesn't provide mapping
          dataQuality: fallbackResult.dataQuality,
          leads: fallbackResult.leads,
          errors: fallbackResult.errors,
          suggestions: fallbackResult.suggestions || ['Consider configuring OpenAI API for better results'],
          customFields: [],
          processingTime: fallbackResult.processingTime,
        });
        setStep('results');
        return;
      }

      setResult(parseResult);
      setStep('results');

    } catch (error) {
      console.error('CSV processing failed:', error);
      onError(error instanceof Error ? error.message : 'Failed to process CSV');
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleImport = () => {
    if (result?.leads) {
      onImportComplete(result.leads);
      setResult(null);
      setStep('upload');
    }
  };

  const downloadJSON = () => {
    if (!result?.leads) return;
    
    const dataStr = JSON.stringify(result.leads, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `parsed-leads-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'processing') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 animate-pulse" />
            Processing CSV File
          </CardTitle>
          <CardDescription>
            Using AI to intelligently map and validate your data...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={undefined} className="w-full" />
          <div className="text-sm text-gray-600 space-y-1">
            <div>• Analyzing column headers</div>
            <div>• Mapping fields intelligently</div>
            <div>• Validating email addresses</div>
            <div>• Detecting duplicates</div>
            <div>• Generating insights</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'results' && result) {
    const qualityScore = Math.round(
      ((result.dataQuality.emailValidation.valid / Math.max(1, result.totalRows)) * 40) +
      ((result.dataQuality.completeness.hasName / Math.max(1, result.totalRows)) * 30) +
      ((result.dataQuality.completeness.hasCompany / Math.max(1, result.totalRows)) * 20) +
      ((result.dataQuality.completeness.hasContact / Math.max(1, result.totalRows)) * 10)
    );

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              CSV Processing Complete
            </CardTitle>
            <CardDescription>
              Processed {result.totalRows} rows in {result.processingTime}ms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">{result.validRows}</div>
                <div className="text-sm text-gray-600">Valid Leads</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Mail className="h-6 w-6 mx-auto mb-1 text-green-600" />
                <div className="text-2xl font-bold text-green-600">{result.dataQuality.emailValidation.valid}</div>
                <div className="text-sm text-gray-600">Valid Emails</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Building2 className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                <div className="text-2xl font-bold text-purple-600">{result.dataQuality.completeness.hasCompany}</div>
                <div className="text-sm text-gray-600">With Company</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                <div className="text-2xl font-bold text-orange-600">{qualityScore}%</div>
                <div className="text-sm text-gray-600">Quality Score</div>
              </div>
            </div>

            {/* Data Quality Insights */}
            <div className="space-y-3">
              <h3 className="font-semibold">Data Quality Analysis</h3>
              
              {result.dataQuality.duplicates > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Duplicates Detected</AlertTitle>
                  <AlertDescription>
                    Found and removed {result.dataQuality.duplicates} duplicate email addresses.
                  </AlertDescription>
                </Alert>
              )}

              {result.errors.length > 0 && (
                <Alert className="border-yellow-500 bg-yellow-50">
                  <XCircle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle>Data Issues Found</AlertTitle>
                  <AlertDescription>
                    {result.errors.length} rows had validation issues. 
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">View Details</summary>
                      <div className="mt-2 space-y-1 text-xs">
                        {result.errors.slice(0, 5).map((error, i) => (
                          <div key={i}>
                            Row {error.row}: {error.field} - {error.error}
                          </div>
                        ))}
                        {result.errors.length > 5 && (
                          <div>... and {result.errors.length - 5} more</div>
                        )}
                      </div>
                    </details>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Column Mapping */}
            <div className="space-y-3">
              <h3 className="font-semibold">Column Mapping</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(result.headerMapping).map(([original, mapped]) => (
                  <div key={original} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{original}</span>
                    <Badge variant={mapped === 'ignore' ? 'secondary' : 'default'}>
                      {mapped}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Fields */}
            {result.customFields.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Custom Fields Detected</h3>
                <div className="flex flex-wrap gap-2">
                  {result.customFields.map((field) => (
                    <Badge key={field} variant="outline">{field}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* AI Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">AI Recommendations</h3>
                <ul className="space-y-1 text-sm">
                  {result.suggestions.slice(0, 5).map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleImport} className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                Import {result.validRows} Leads
              </Button>
              <Button variant="outline" onClick={downloadJSON}>
                <Download className="h-4 w-4 mr-2" />
                Download JSON
              </Button>
              <Button variant="outline" onClick={() => { setResult(null); setStep('upload'); }}>
                <Eye className="h-4 w-4 mr-2" />
                New File
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Enhanced CSV Import
        </CardTitle>
        <CardDescription>
          Upload your CSV file for intelligent parsing and validation using AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">
            Drop your CSV file here, or click to browse
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Supports intelligent column mapping, email validation, and duplicate detection
          </p>
          
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            disabled={isProcessing}
          />
          
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={isProcessing}
            variant="outline"
          >
            {isProcessing ? 'Processing...' : 'Choose File'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
