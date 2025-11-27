import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isMine: boolean;
  type: 'text' | 'file' | 'image';
  fileName?: string;
  fileSize?: string;
}

interface ChatWindowProps {
  chatId?: string;
}

const mockMessages: Message[] = [
  {
    id: '1',
    text: 'Привет! Как дела?',
    timestamp: '14:30',
    isMine: false,
    type: 'text',
  },
  {
    id: '2',
    text: 'Отлично! Работаю над новым проектом',
    timestamp: '14:31',
    isMine: true,
    type: 'text',
  },
  {
    id: '3',
    text: 'Вот файлы которые ты просил',
    timestamp: '14:31',
    isMine: true,
    type: 'text',
  },
  {
    id: '4',
    text: '',
    timestamp: '14:32',
    isMine: true,
    type: 'file',
    fileName: 'design-mockup.fig',
    fileSize: '2.4 MB',
  },
  {
    id: '5',
    text: 'Супер, спасибо! Посмотрю',
    timestamp: '14:32',
    isMine: false,
    type: 'text',
  },
];

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: String(Date.now()),
        text: newMessage,
        timestamp: new Date().toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isMine: true,
        type: 'text',
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <Icon name="MessageSquare" size={64} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg">Выберите чат, чтобы начать общение</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              АИ
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">Алексей Иванов</h3>
            <p className="text-xs text-muted-foreground">онлайн</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-xl" title="Голосовой звонок">
            <Icon name="Phone" size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl" title="Видеозвонок">
            <Icon name="Video" size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <Icon name="MoreVertical" size={20} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`flex gap-2 max-w-[70%] ${message.isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                {!message.isMine && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      АИ
                    </AvatarFallback>
                  </Avatar>
                )}

                <div>
                  {message.type === 'text' && (
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        message.isMine
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                  )}

                  {message.type === 'file' && (
                    <div
                      className={`px-4 py-3 rounded-2xl flex items-center gap-3 ${
                        message.isMine
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          message.isMine ? 'bg-primary-foreground/20' : 'bg-primary/10'
                        }`}
                      >
                        <Icon
                          name="FileText"
                          size={20}
                          className={message.isMine ? '' : 'text-primary'}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{message.fileName}</p>
                        <p
                          className={`text-xs ${
                            message.isMine ? 'opacity-80' : 'text-muted-foreground'
                          }`}
                        >
                          {message.fileSize}
                        </p>
                      </div>
                    </div>
                  )}

                  <p
                    className={`text-xs text-muted-foreground mt-1 ${
                      message.isMine ? 'text-right' : 'text-left'
                    }`}
                  >
                    {message.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            title="Прикрепить файл"
          >
            <Icon name="Paperclip" size={20} />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                const file = e.target.files[0];
                const message: Message = {
                  id: String(Date.now()),
                  text: '',
                  timestamp: new Date().toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  isMine: true,
                  type: 'file',
                  fileName: file.name,
                  fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
                };
                setMessages([...messages, message]);
              }
            }}
          />

          <Input
            placeholder="Введите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-secondary/50 border-0 rounded-xl"
          />

          <Button
            size="icon"
            onClick={handleSendMessage}
            className="rounded-xl flex-shrink-0"
            disabled={!newMessage.trim()}
          >
            <Icon name="Send" size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
