'use client';

import { CheckCircle2, AlertCircle, Flame, Star } from 'lucide-react';

export function RecentActivityFeed() {
  const activities = [
    {
      id: 1,
      type: 'solved',
      title: 'Solved "Two Sum"',
      description: 'Optimal solution in 32ms',
      time: '2 hours ago',
      icon: CheckCircle2,
      color: 'text-green-500'
    },
    {
      id: 2,
      type: 'streak',
      title: 'Streak: 7 days',
      description: 'Keep practicing daily!',
      time: '1 day ago',
      icon: Flame,
      color: 'text-orange-500'
    },
    {
      id: 3,
      type: 'achievement',
      title: 'Achievement Unlocked',
      description: '100% Success Rate on Easy',
      time: '3 days ago',
      icon: Star,
      color: 'text-yellow-500'
    },
    {
      id: 4,
      type: 'attempted',
      title: 'Attempted "Median Arrays"',
      description: 'Wrong answer on test 2',
      time: '5 days ago',
      icon: AlertCircle,
      color: 'text-blue-500'
    }
  ];

  return (
    <div className="space-y-3">
      {activities.map(activity => {
        const Icon = activity.icon;
        return (
          <div key={activity.id} className="flex gap-3 p-3 bg-background/50 rounded-lg border border-border/50 hover:border-border transition-colors">
            <Icon className={`w-5 h-5 ${activity.color} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{activity.title}</p>
              <p className="text-xs text-foreground/60 mt-0.5">{activity.description}</p>
              <p className="text-xs text-foreground/40 mt-1">{activity.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
