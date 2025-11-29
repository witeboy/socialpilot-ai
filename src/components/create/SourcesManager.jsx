import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Sparkles, Rss, Link as LinkIcon, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

export default function SourcesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [sourceType, setSourceType] = useState('url');
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceText, setSourceText] = useState('');

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Source.filter({ created_by: user.email });
    }
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const data = {
        source_type: sourceType,
        title: title.trim() || 'Untitled Source',
        is_active: true,
        content_generated_count: 0
      };

      if (sourceType === 'url' || sourceType === 'rss') {
        data.source_url = sourceUrl;
      } else {
        data.source_text = sourceText;
      }

      return base44.entities.Source.create(data);
    },
    onSuccess: () => {
      toast({ title: '✅ Source Added' });
      setShowAdd(false);
      setTitle('');
      setSourceUrl('');
      setSourceText('');
      queryClient.invalidateQueries(['sources']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Source.delete(id),
    onSuccess: () => {
      toast({ title: '🗑️ Source Removed' });
      queryClient.invalidateQueries(['sources']);
    }
  });

  const sourceIcons = {
    rss: Rss,
    url: LinkIcon,
    text: FileText
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Content Sources</h3>
          <Button
            size="sm"
            onClick={() => setShowAdd(!showAdd)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Source
          </Button>
        </div>

        {showAdd && (
          <div className="space-y-3 mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div>
              <Label className="text-slate-300">Source Type</Label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">Article URL</SelectItem>
                  <SelectItem value="rss">RSS Feed</SelectItem>
                  <SelectItem value="text">Manual Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My favorite blog..."
                className="bg-slate-900 border-slate-700 text-white mt-2"
              />
            </div>

            {(sourceType === 'url' || sourceType === 'rss') && (
              <div>
                <Label className="text-slate-300">URL</Label>
                <Input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-slate-900 border-slate-700 text-white mt-2"
                />
              </div>
            )}

            {sourceType === 'text' && (
              <div>
                <Label className="text-slate-300">Text Content</Label>
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Paste text content..."
                  className="w-full h-24 bg-slate-900 border border-slate-700 rounded-md p-2 text-white mt-2"
                />
              </div>
            )}

            <Button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Save Source
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {sources.length === 0 ? (
            <p className="text-center text-slate-400 py-4">
              No sources yet. Add RSS feeds, URLs, or text to generate content from.
            </p>
          ) : (
            sources.map((source) => {
              const Icon = sourceIcons[source.source_type];
              return (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Icon className="w-5 h-5 text-cyan-400" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{source.title}</p>
                      {source.source_url && (
                        <p className="text-xs text-slate-500 truncate">{source.source_url}</p>
                      )}
                      <Badge variant="outline" className="mt-1 text-xs border-green-500/50 text-green-400">
                        {source.content_generated_count || 0} posts generated
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(source.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <div className="text-xs text-slate-400 text-center">
        💡 Sources are used for automatic daily content generation
      </div>
    </div>
  );
}