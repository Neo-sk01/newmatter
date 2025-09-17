"use client"

import { useEffect, useMemo, useState } from 'react'
import { Folder as FolderIcon, Building2, Globe, Search, Copy, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { Folder, Prompt } from '@/types/prompting'

type TreeLoader = () => Promise<{ folders: Folder[]; prompts: Prompt[] }>

export function PromptPicker({
  treeLoader,
  onUsePrompt,
  onCloneToCompany,
  companyFolderId,
  children,
}: {
  treeLoader: TreeLoader
  onUsePrompt: (p: Prompt) => Promise<void> | void
  onCloneToCompany: (p: Prompt, destFolderId: string) => Promise<void> | void
  companyFolderId: string | null
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [folders, setFolders] = useState<Folder[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | 'all'>('all')
  const [q, setQ] = useState('')
  const [active, setActive] = useState<Prompt | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    ;(async () => {
      const { folders, prompts } = await treeLoader()
      setFolders(folders)
      setPrompts(prompts)
      setActive(prompts[0] ?? null)
    })()
  }, [open, treeLoader])

  const filtered = useMemo(() => {
    const list = prompts.filter((p) => (selectedFolder === 'all' ? true : p.folder_id === selectedFolder))
    const qq = q.trim().toLowerCase()
    if (!qq) return list
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(qq) ||
        (p.description ?? '').toLowerCase().includes(qq) ||
        p.content.toLowerCase().includes(qq)
    )
  }, [prompts, selectedFolder, q])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children ?? <Button variant="outline">Choose Prompt</Button>}</DialogTrigger>
      <DialogContent className="max-w-5xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Choose a Prompt</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left: Folder tree */}
          <div className="md:col-span-1">
            <div className="text-xs text-muted-foreground mb-2">Folders</div>
            <div className="space-y-1">
              <button
                className={`w-full text-left rounded-lg px-2 py-1.5 hover:bg-muted ${selectedFolder === 'all' ? 'bg-muted' : ''}`}
                onClick={() => setSelectedFolder('all')}
              >
                <FolderIcon className="inline h-4 w-4 mr-2" /> All
              </button>
              <ScrollArea className="h-64 pr-2">
                <div className="space-y-1">
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      className={`w-full text-left rounded-lg px-2 py-1.5 hover:bg-muted ${selectedFolder === f.id ? 'bg-muted' : ''}`}
                      onClick={() => setSelectedFolder(f.id)}
                    >
                      {f.company_id ? (
                        <Building2 className="inline h-4 w-4 mr-2" />
                      ) : (
                        <Globe className="inline h-4 w-4 mr-2" />
                      )}
                      {f.name}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Middle: List */}
          <div className="md:col-span-1">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search prompts" className="pl-9 rounded-xl" />
            </div>
            <ScrollArea className="h-72 pr-2">
              <div className="space-y-1">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActive(p)}
                    className={`w-full text-left rounded-lg px-2 py-1.5 hover:bg-muted ${active?.id === p.id ? 'bg-muted' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium truncate">{p.name}</div>
                      <Badge variant="outline">v{p.version}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{p.description || '—'}</div>
                  </button>
                ))}
                {filtered.length === 0 && <div className="text-sm text-muted-foreground py-6">No prompts</div>}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Preview */}
          <div className="md:col-span-1">
            <div className="text-xs text-muted-foreground mb-2">Preview</div>
            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="meta">Meta</TabsTrigger>
              </TabsList>
              <TabsContent value="content" className="mt-2">
                <Textarea value={active?.content || ''} readOnly className="min-h-56 rounded-2xl text-xs" />
              </TabsContent>
              <TabsContent value="meta" className="mt-2">
                <div className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> {active?.name}</div>
                  <div><span className="text-muted-foreground">Version:</span> v{active?.version}</div>
                  <div>
                    <span className="text-muted-foreground">Variables:</span>{' '}
                    {active?.variables?.length ? active?.variables.join(', ') : '—'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Scope:</span>{' '}
                    {active?.company_id ? 'Company' : 'Global'}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex items-center justify-between mt-3">
              <Button
                className="rounded-xl"
                onClick={async () => {
                  if (!active) return
                  await onUsePrompt(active)
                  setOpen(false)
                }}
              >
                Use this prompt <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={!active || !companyFolderId || !active || !!active?.company_id}
                onClick={async () => {
                  if (!active || !companyFolderId) return
                  await onCloneToCompany(active, companyFolderId)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
              >
                {copied ? <><Check className="mr-2 h-4 w-4" /> Cloned</> : <><Copy className="mr-2 h-4 w-4" /> Clone to my folder</>}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

