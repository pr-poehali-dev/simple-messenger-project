import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

type Section = 'chats' | 'groups' | 'channels' | 'contacts' | 'profile' | 'settings';

interface SidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const menuItems = [
    { id: 'chats' as Section, icon: 'MessageSquare', label: 'Чаты' },
    { id: 'groups' as Section, icon: 'Users', label: 'Группы' },
    { id: 'channels' as Section, icon: 'Radio', label: 'Каналы' },
    { id: 'contacts' as Section, icon: 'UserRound', label: 'Контакты' },
  ];

  const bottomItems = [
    { id: 'profile' as Section, icon: 'User', label: 'Профиль' },
    { id: 'settings' as Section, icon: 'Settings', label: 'Настройки' },
  ];

  return (
    <div className="w-20 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 gap-2">
      <div className="mb-6">
        <Avatar className="h-12 w-12 cursor-pointer hover-scale">
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
            МЯ
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 flex flex-col gap-2 w-full px-2">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="icon"
            onClick={() => onSectionChange(item.id)}
            className={`w-full h-14 rounded-xl transition-all ${
              activeSection === item.id
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            }`}
            title={item.label}
          >
            <Icon name={item.icon} size={24} />
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2 w-full px-2 pt-2 border-t border-sidebar-border">
        {bottomItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="icon"
            onClick={() => onSectionChange(item.id)}
            className={`w-full h-14 rounded-xl transition-all ${
              activeSection === item.id
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            }`}
            title={item.label}
          >
            <Icon name={item.icon} size={24} />
          </Button>
        ))}
      </div>
    </div>
  );
}
