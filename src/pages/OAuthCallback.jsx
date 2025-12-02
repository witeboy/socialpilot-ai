import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    if (hasRun) return;
    setHasRun(true);
    
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          setStatus('error');
          toast.error('Connection Failed', { description: error });
          setTimeout(() => navigate(createPageUrl('Settings')), 2000);
          return;
        }

        if (!code) {
          setStatus('error');
          toast.error('Invalid callback');
          setTimeout(() => navigate(createPageUrl('Settings')), 2000);
          return;
        }

        const result = await base44.functions.invoke('handleOAuthCallback', {
          code,
          state
        });

        if (result.data.success) {
          setStatus('success');
          toast.success('Connected!', { 
            description: `${result.data.platform} account connected as @${result.data.username}` 
          });
          setTimeout(() => navigate(createPageUrl('Settings')), 1500);
        } else {
          setStatus('error');
          toast.error('Connection failed');
          setTimeout(() => navigate(createPageUrl('Settings')), 2000);
        }
      } catch (error) {
        console.error('OAuth error:', error);
        setStatus('error');
        toast.error('Connection failed', { description: error.message });
        setTimeout(() => navigate(createPageUrl('Settings')), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#0FB5BA] animate-spin" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Connecting...</h2>
            <p className="text-sm text-slate-600">Please wait while we connect your account</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Connected!</h2>
            <p className="text-sm text-slate-600">Redirecting to settings...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Failed</h2>
            <p className="text-sm text-slate-600">Redirecting to settings...</p>
          </>
        )}
      </div>
    </div>
  );
}