"use client";

import React from 'react';
import { Check, ChevronDown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useWorkspace } from '@/lib/context/workspace-context';

export function WorkspaceSwitcher() {
  const { currentWorkspace, setCurrentWorkspace, availableWorkspaces } = useWorkspace();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2 py-1 h-auto rounded-xl">
          <Avatar className="h-8 w-8" style={{ backgroundColor: currentWorkspace.color }}>
            <AvatarFallback 
              className="text-white text-xs font-semibold"
              style={{ backgroundColor: currentWorkspace.color }}
            >
              {currentWorkspace.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left">
            <div className="text-sm font-medium">{currentWorkspace.name}</div>
            <div className="text-xs text-muted-foreground">{currentWorkspace.description}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-xl">
        <div className="px-2 py-1.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Switch Workspace
          </div>
          {availableWorkspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
              onClick={() => setCurrentWorkspace(workspace)}
            >
              <Avatar className="h-10 w-10" style={{ backgroundColor: workspace.color }}>
                <AvatarFallback 
                  className="text-white font-semibold"
                  style={{ backgroundColor: workspace.color }}
                >
                  {workspace.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{workspace.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {workspace.description}
                </div>
              </div>
              {currentWorkspace.id === workspace.id && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
        <div className="border-t px-2 py-1.5">
          <div className="text-xs text-muted-foreground px-3 py-2">
            <Building2 className="h-3 w-3 inline mr-1" />
            Current: {currentWorkspace.settings.website}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
