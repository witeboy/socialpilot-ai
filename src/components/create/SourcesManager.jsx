import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Rss, Link2, FileText, Loader2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function SourcesManager({ onComplete }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [sourceType, setSourceType] = useState('url');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

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

      // Auto-generate title
      let autoTitle = '';
      if (sourceType === 'text') {
        autoTitle = text.substring(0, 50) + (text.length > 50 ? '...' : '');
      } else {
        autoTitle = url;
      }

      return base44.entities.Source.create({
        source_type: sourceType,
        title: autoTitle,
        ...(sourceType === 'text' ? { source_text: text } : { source_url: url }),
        is_active: true,
        content_generated_count: 0
      });
    },
    onSuccess: () => {
      toast({ title: '✅ Source Added', duration: 3000 });
      setUrl('');
      setText('');
      setShowAddForm(false);
      queryClient.invalidateQueries(['sources']);
      if (onComplete) {
        setTimeout(() => onComplete(), 500);
      }
    },
    onError: (error) => {
      toast({ title: '❌ Failed', description: error.message, variant: 'destructive', duration: 3000 });
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
    <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white">Content Sources</h3>
          <p className="text-xs text-indigo-300 mt-0.5">Add permanent sources for content generation</p>
        </div>
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-500 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="bg-white/5 border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-white text-sm font-semibold">Add New Source</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div>
            <Label className="text-indigo-300 mb-2 block text-xs sm:text-sm">Source Type</Label>
            <Select value={sourceType} onValueChange={setSourceType}>
              <SelectTrigger className="bg-white/10 border-white/10 text-white rounded-xl text-xs sm:text-sm">
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
              <Label className="text-indigo-300 mb-2 block text-xs sm:text-sm">URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/feed"
                className="bg-white/10 border-white/10 text-white rounded-xl text-xs sm:text-sm"
              />
            </div>
          )}

          {sourceType === 'text' && (
            <div>
              <Label className="text-indigo-300 mb-2 block text-xs sm:text-sm">Content</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your content here..."
                className="bg-white/10 border-white/10 text-white rounded-xl text-xs sm:text-sm"
                rows={4}
              />
            </div>
          )}

          <Button
            onClick={() => addSourceMutation.mutate()}
            disabled={addSourceMutation.isPending}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-xl text-xs sm:text-sm"
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
          <h4 className="text-xs sm:text-sm font-semibold text-indigo-300">Active Sources ({sources.length})</h4>
          {sources.length > 0 && (
            <span className="text-xs text-slate-400">Used for all content generation</span>
          )}
        </div>
        {sources.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No sources added yet</p>
            <p className="text-slate-500 text-xs mt-1">Add RSS feeds, URLs, or text sources</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="p-3 sm:p-4 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl border border-white/10 hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {source.source_type === 'rss' && <Rss className="w-4 h-4 text-orange-400 flex-shrink-0" />}
                      {source.source_type === 'url' && <Link2 className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                      {source.source_type === 'text' && <FileText className="w-4 h-4 text-green-400 flex-shrink-0" />}
                      <p className="text-white font-medium text-sm sm:text-base truncate">{source.title}</p>
                    </div>
                    {source.source_url && (
                      <p className="text-xs text-indigo-300 truncate mb-1">{source.source_url}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      ✅ {source.content_generated_count || 0} posts generated
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSourceMutation.mutate(source.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}