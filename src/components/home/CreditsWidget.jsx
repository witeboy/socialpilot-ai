import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Play, Plus } from 'lucide-react';

export default function CreditsWidget({ credits, onTopUp, onWatchAd }) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-cyan-900/40 backdrop-blur-sm border border-purple-500/30">
      {/* Animated Background Ring */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
      
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-2">Available Credits</p>
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-yellow-400" />
              <span className="text-5xl font-bold text-white">{credits}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={onTopUp}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
            >
              <Plus className="w-4 h-4 mr-1" />
              Top Up
            </Button>
            
            <Button
              onClick={onWatchAd}
              size="sm"
              variant="outline"
              className="border-green-500/50 text-green-400 hover:bg-green-500/10"
            >
              <Play className="w-4 h-4 mr-1" />
              Watch Ad
            </Button>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-slate-400">
            💡 Generate posts, images, and videos using credits
          </p>
        </div>
      </div>
    </Card>
  );
}