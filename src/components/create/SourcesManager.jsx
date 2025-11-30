import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Rss, Link2, FileText, Loader2, X, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';

export default function SourcesManager({ onComplete }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [sourceType, setSourceType] = useState('url');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [expandedSourceId, setExpandedSourceId] = useState(null);

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Source.filter({ created_by: user.email });
    }
  });

  const addSourceMutation = useMutation({
    mutationFn: async () => {
      if (sourceType !== 'text' && !url.trim()) throw new Error('URL required');
      if (sourceType === 'text' && !text.trim()) throw new Error('Text required');

      let autoTitle = '';
      let scrapedContent = '';

      if (sourceType === 'text') {
        autoTitle = text.substring(0, 50) + (text.length > 50 ? '...' : '');
        scrapedContent = text;
      } else {
        // Scrape content from URL or RSS
        sonnerToast.loading('Fetching content from source...');
        try {
          const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
          const data = await response.json();
          
          if (!data.contents) {
            throw new Error('Failed to fetch content');
          }

          // Use a simple parser to extract text
          const parser = new DOMParser();
          const doc = parser.parseFromString(data.contents, 'text/html');
          
          // Remove script and style elements
          const scripts = doc.querySelectorAll('script, style');
          scripts.forEach(el => el.remove());
          
          // Get text content
          scrapedContent = doc.body.textContent || doc.body.innerText || '';
          scrapedContent = scrapedContent.replace(/\s+/g, ' ').trim();
          
          // Limit to first 5000 characters
          if (scrapedContent.length > 5000) {
            scrapedContent = scrapedContent.substring(0, 5000) + '...';
          }

          // Extract title from page
          const titleEl = doc.querySelector('title');
          autoTitle = titleEl ? titleEl.textContent.trim() : url;
        } catch (error) {
          console.error('Scraping error:', error);
          sonnerToast.error('Failed to fetch content, saving URL only');
          autoTitle = url;
          scrapedContent = ''; // Will store URL but no content preview
        }
      }

      return base44.entities.Source.create({
        source_type: sourceType,
        title: autoTitle,
        source_url: sourceType !== 'text' ? url : undefined,
        source_text: scrapedContent || undefined,
        is_active: true,
        content_generated_count: 0
      });
    },
    onSuccess: () => {
      sonnerToast.success('Source Added!', { description: 'Content preview is ready' });
      setUrl('');
      setText('');
      setShowAddForm(false);
      queryClient.invalidateQueries(['sources']);
    },
    onError: (error) => {
      sonnerToast.error('Failed to add source', { description: error.message });
    }
  });

  const deleteSourceMutation = useMutation({
    mutationFn: (id) => base44.entities.Source.delete(id),
    onSuccess: () => {
      toast({ title: '🗑️ Source Removed', duration: 3000 });
      queryClient.invalidateQueries(['sources']);
    }
  });

  return (
    <Card className="bg-white border border-slate-200 rounded-xl shadow-md p-5 sm:p-7 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">Content Sources</h3>
          <p className="text-xs text-slate-600 mt-0.5">Add permanent sources for content generation</p>
        </div>
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="h-11 px-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-[#DDF7F8] hover:border-[#0FB5BA] text-xs sm:text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="bg-slate-50 border border-slate-200 p-4 space-y-3 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-slate-900 text-sm font-semibold">Add New Source</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div>
            <Label className="text-slate-700 mb-2 block text-xs sm:text-sm font-semibold">Source Type</Label>
            <Select value={sourceType} onValueChange={setSourceType}>
              <SelectTrigger className="h-11 rounded-lg bg-white border border-slate-200 px-4 text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-teal-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="url">🔗 Article URL</SelectItem>
                <SelectItem value="rss">📡 RSS Feed</SelectItem>
                <SelectItem value="text">📝 Manual Text</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sourceType !== 'text' && (
            <div>
              <Label className="text-slate-700 mb-2 block text-xs sm:text-sm font-semibold">URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/feed"
                className="h-11 rounded-lg bg-white border border-slate-200 px-4 text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-teal-100"
              />
            </div>
          )}

          {sourceType === 'text' && (
            <div>
              <Label className="text-slate-700 mb-2 block text-xs sm:text-sm font-semibold">Content</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your content here..."
                className="rounded-lg bg-white border border-slate-200 px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-teal-100"
                rows={4}
              />
            </div>
          )}

          <Button
            onClick={() => addSourceMutation.mutate()}
            disabled={addSourceMutation.isPending}
            className="w-full h-12 px-4 rounded-lg text-white font-semibold bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] shadow-md hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {addSourceMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Save Source
              </>
            )}
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-semibold text-slate-900">Active Sources ({sources.length})</h4>
          {sources.length > 0 && (
            <span className="text-xs text-slate-600">Used for all content generation</span>
          )}
        </div>
        {sources.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 text-sm">No sources added yet</p>
            <p className="text-slate-500 text-xs mt-1">Add RSS feeds, URLs, or text sources</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#0FB5BA] hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {source.source_type === 'rss' && <Rss className="w-4 h-4 text-orange-500 flex-shrink-0" />}
                      {source.source_type === 'url' && <Link2 className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                      {source.source_type === 'text' && <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />}
                      <p className="text-slate-900 font-medium text-sm sm:text-base truncate">{source.title}</p>
                    </div>
                    {source.source_url && (
                      <p className="text-xs text-slate-600 truncate mb-1">{source.source_url}</p>
                    )}
                    <p className="text-xs text-slate-500">
                     ✅ {source.content_generated_count || 0} posts generated
                    </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                    {source.source_text && (
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => setExpandedSourceId(expandedSourceId === source.id ? null : source.id)}
                       className="text-[#0FB5BA] hover:text-[#14D4BA] hover:bg-[#DDF7F8]"
                     >
                       {expandedSourceId === source.id ? (
                         <ChevronUp className="w-4 h-4" />
                       ) : (
                         <Eye className="w-4 h-4" />
                       )}
                     </Button>
                    )}
                    <Button
                     variant="ghost"
                     size="icon"
                     onClick={() => deleteSourceMutation.mutate(source.id)}
                     className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                     <Trash2 className="w-4 h-4" />
                    </Button>
                    </div>
                    </div>
                    {expandedSourceId === source.id && source.source_text && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                    <Label className="text-slate-700 text-xs font-semibold mb-2 block">Content Preview</Label>
                    <div className="bg-white rounded-lg p-3 border border-slate-200 max-h-48 overflow-y-auto">
                     <p className="text-xs text-slate-700 whitespace-pre-wrap">{source.source_text}</p>
                    </div>
                    </div>
                    )}
                    </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}