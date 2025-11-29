import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function EmptyFeed() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-purple-400" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            All Caught Up!
          </h2>
          <p className="text-slate-400">
            No pending drafts to review. Create new content or wait for automatic generation.
          </p>
        </div>

        <Button
          onClick={() => navigate(createPageUrl('Create'))}
          className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Create New Content
        </Button>
      </div>
    </div>
  );
}