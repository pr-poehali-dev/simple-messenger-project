import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Chat {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online?: boolean;
}

interface ChatListProps {
  onChatSelect: (chatId: string) => void;
  selectedChatId?: string;
}

const mockChats: Chat[] = [
  {
    id: '1',
    name: 'Алексей Иванов',
    lastMessage: 'Привет! Как дела?',
    time: '14:32',
    unread: 3,
    online: true,
  },
  {
    id: '2',
    name: 'Команда Frontend',
    lastMessage: 'Отправил файл design.fig',
    time: '13:15',
    unread: 1,
  },
  {
    id: '3',
    name: 'Мария Петрова',
    lastMessage: 'Спасибо за помощь! 👍',
    time: '12:00',
    online: true,
  },
  {
    id: '4',
    name: 'Проект Альфа',
    lastMessage: 'Встреча перенесена на 16:00',
    time: 'Вчера',
  },
  {
    id: '5',
    name: 'Дмитрий Сидоров',
    lastMessage: 'Посмотри это видео',
    time: 'Вчера',
  },
];

export default function ChatList({ onChatSelect, selectedChatId }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [chats] = useState<Chat[]>(mockChats);

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-2xl font-bold mb-4">Чаты</h2>
        <div className="relative">
          <Icon
            name="Search"
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50 border-0"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onChatSelect(chat.id)}
              className={`p-3 rounded-xl cursor-pointer transition-all hover:bg-accent/10 animate-fade-in ${
                selectedChatId === chat.id ? 'bg-accent/20' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={chat.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {chat.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {chat.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm truncate">{chat.name}</h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {chat.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.lastMessage}
                    </p>
                    {chat.unread && (
                      <Badge
                        variant="default"
                        className="ml-2 flex-shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-primary text-xs"
                      >
                        {chat.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
