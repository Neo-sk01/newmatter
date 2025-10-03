'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Bug, Eye, EyeOff } from 'lucide-react';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  title?: string;
  website?: string;
  linkedin?: string;
  status: string;
}

interface LeadList {
  id: string;
  name: string;
  leads: Lead[];
}

interface LeadsDebuggerProps {
  leads: Lead[];
  leadLists: LeadList[];
  currentListId: string;
  importing: boolean;
  importError: string | null;
}

export function LeadsDebugger({ 
  leads, 
  leadLists, 
  currentListId, 
  importing, 
  importError 
}: LeadsDebuggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const currentList = leadLists.find(list => list.id === currentListId);

  return (
    <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-sm text-orange-800 dark:text-orange-200">
              Leads Debug Info
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-6 px-2 text-orange-600 hover:text-orange-700"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {isOpen ? 'Hide' : 'Show'}
          </Button>
        </div>
      </CardHeader>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Status Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-orange-700 dark:text-orange-300">Current Leads</div>
                <Badge variant="outline" className="mt-1">
                  {leads.length}
                </Badge>
              </div>
              <div>
                <div className="font-medium text-orange-700 dark:text-orange-300">Lead Lists</div>
                <Badge variant="outline" className="mt-1">
                  {leadLists.length}
                </Badge>
              </div>
              <div>
                <div className="font-medium text-orange-700 dark:text-orange-300">Current List</div>
                <Badge variant="outline" className="mt-1">
                  {currentList?.name || 'None'}
                </Badge>
              </div>
              <div>
                <div className="font-medium text-orange-700 dark:text-orange-300">Status</div>
                <Badge 
                  variant={importing ? "default" : importError ? "destructive" : "secondary"}
                  className="mt-1"
                >
                  {importing ? 'Importing...' : importError ? 'Error' : 'Ready'}
                </Badge>
              </div>
            </div>

            {/* Error Display */}
            {importError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="text-sm font-medium text-red-800 dark:text-red-200">Import Error:</div>
                <div className="text-sm text-red-600 dark:text-red-400 mt-1">{importError}</div>
              </div>
            )}

            {/* Current List Details */}
            {currentList && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Current List: {currentList.name}
                  </div>
                  <Badge variant="outline">{currentList.leads.length} leads</Badge>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  List ID: {currentList.id}
                </div>
              </div>
            )}

            {/* Detailed View Toggle */}
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Detailed Information
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="h-6 px-2 text-orange-600 hover:text-orange-700"
              >
                {showDetails ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
            </div>

            {/* Detailed Information */}
            {showDetails && (
              <div className="space-y-4 text-xs">
                {/* Lead Lists */}
                <div>
                  <div className="font-medium text-orange-700 dark:text-orange-300 mb-2">Lead Lists:</div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded border max-h-32 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(
                        leadLists.map(list => ({
                          id: list.id,
                          name: list.name,
                          leadsCount: list.leads.length,
                          leadIds: list.leads.map(l => l.id).slice(0, 3)
                        })),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>

                {/* Current Leads */}
                <div>
                  <div className="font-medium text-orange-700 dark:text-orange-300 mb-2">Current Leads State:</div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded border max-h-32 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(
                        leads.map(lead => ({
                          id: lead.id,
                          name: `${lead.firstName} ${lead.lastName}`.trim(),
                          company: lead.company,
                          email: lead.email,
                          status: lead.status
                        })),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('=== LEADS DEBUG INFO ===');
                  console.log('Current leads:', leads);
                  console.log('Lead lists:', leadLists);
                  console.log('Current list ID:', currentListId);
                  console.log('Current list:', currentList);
                  console.log('Importing:', importing);
                  console.log('Import error:', importError);
                  console.log('========================');
                }}
                className="h-6"
              >
                Log to Console
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const data = {
                    leads,
                    leadLists,
                    currentListId,
                    currentList,
                    importing,
                    importError,
                    timestamp: new Date().toISOString()
                  };
                  navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
                }}
                className="h-6"
              >
                Copy State
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

