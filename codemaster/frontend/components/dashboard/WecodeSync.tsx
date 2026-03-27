'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function WecodeSync() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success('12 problems imported from Wecode!', {
        description: 'Your progress has been synced successfully'
      });
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Connected</p>
          <p className="text-xs text-foreground/60">Ready to sync</p>
        </div>
      </div>
      
      <Button
        onClick={handleSync}
        disabled={isLoading}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Zap className="w-4 h-4 mr-2" />
        {isLoading ? 'Syncing...' : 'Sync Now'}
      </Button>
    </div>
  );
}
