'use client';

import { useState } from 'react';
import { Bell, Zap, Download, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/lib/auth-context';
import { LoginDialog } from './LoginDialog';

import { usePathname } from 'next/navigation';

export function TopBar() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const pathname = usePathname();

  const getTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'Bảng điều khiển';
    if (pathname.startsWith('/practice')) return 'Khu vực luyện tập';
    if (pathname.startsWith('/syllabus-upload')) return 'Quản lý giáo trình';
    if (pathname.startsWith('/mock-exams')) return 'Phòng thi thử';
    if (pathname.startsWith('/settings')) return 'Cài đặt hệ thống';
    return 'CodeMaster';
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-6 z-30">
      {/* Left Section - Search/Title */}
      <div className="flex-1 flex items-center">
        <h2 className="text-lg font-bold text-foreground">{getTitle()}</h2>
      </div>

      {/* Right Section - Status & Menu */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        {/* Wecode Sync Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-secondary/20 border border-secondary/30 rounded-lg hover:border-secondary/60 transition-colors cursor-pointer group">
          <Zap className="w-4 h-4 text-yellow-500 group-hover:animate-pulse" />
          <span className="text-sm font-medium text-foreground">Đồng bộ Wecode</span>
        </div>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-secondary"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* Profile Dropdown */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="pl-2 pr-3 h-10 hover:bg-secondary">
                <Avatar className="w-6 h-6 mr-2">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                  <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-bold">{user.username}</p>
                <p className="text-xs text-foreground/60">{user.role}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <UserIcon className="w-4 h-4 mr-2" />
                <span>Hồ sơ cá nhân</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Download className="w-4 h-4 mr-2" />
                <span>Tải tiến độ</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => logout()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => setShowLogin(true)}>Đăng nhập</Button>
        )}
      </div>

      <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
    </header>
  );
}
