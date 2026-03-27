'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Code2, BarChart3, FileText, Settings, BookOpen, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const navigationItems = [
  {
    name: 'Bảng điều khiển',
    href: '/dashboard',
    icon: BarChart3,
    description: 'Theo dõi tiến độ'
  },
  {
    name: 'Luyện tập',
    href: '/practice',
    icon: Code2,
    description: 'Giải các bài toán'
  },
  {
    name: 'Thi thử',
    href: '/mock-exams',
    icon: Trophy,
    description: 'Kiểm tra năng lực'
  },
  {
    name: 'Giáo trình',
    href: '/syllabus-upload',
    icon: BookOpen,
    description: 'Tải lên & Quản lý'
  },
  {
    name: 'Cài đặt',
    href: '/settings',
    icon: Settings,
    description: 'Tùy chỉnh'
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col pt-8 z-40">
      {/* Logo */}
      <div className="px-6 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">CodeMaster</h1>
            <p className="text-xs text-sidebar-foreground/60">Học lập trình cùng AI</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                   'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer group',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    isActive && 'group-hover:scale-110'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className={cn(
                    'text-xs truncate transition-opacity',
                    isActive ? 'text-sidebar-primary-foreground/70' : 'text-sidebar-foreground/50'
                  )}>
                    {item.description}
                  </p>
                </div>
                {isActive && (
                  <div className="w-1 h-6 bg-accent rounded-full" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer Stats */}
      <div className="border-t border-sidebar-border p-4 space-y-3">
        <div className="bg-sidebar-accent rounded-lg p-3">
          <p className="text-xs text-sidebar-foreground/60 mb-1">Chuỗi ngày học</p>
          <p className="text-2xl font-bold text-sidebar-primary">{user?.streak ?? 0} 🔥</p>
        </div>
        <div className="bg-sidebar-accent rounded-lg p-3">
          <p className="text-xs text-sidebar-foreground/60 mb-1">Bài tập đã giải</p>
          <p className="text-2xl font-bold text-sidebar-primary">{user?.total_solved ?? 0}</p>
        </div>
      </div>
    </aside>
  );
}
