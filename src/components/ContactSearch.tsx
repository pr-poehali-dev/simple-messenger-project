import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  full_name: string;
  avatar_url?: string;
  online_status: boolean;
  is_contact: boolean;
}

interface ContactSearchProps {
  currentUserId: number;
}

export default function ContactSearch({ currentUserId }: ContactSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://functions.poehali.dev/17351105-6be6-497f-bba1-05366001a96a?query=${encodeURIComponent(searchQuery)}&current_user_id=${currentUserId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка поиска');
      }

      setUsers(data.users);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Ошибка поиска',
        description: error.message,
      });
    } finally {
      setSearching(false);
    }
  };

  const handleAddContact = async (contactUserId: number) => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/6eba80ad-361b-49e4-acd6-449781e0f0f6', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUserId,
          contact_user_id: contactUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка добавления');
      }

      toast({
        title: 'Успешно!',
        description: 'Пользователь добавлен в контакты',
      });

      setUsers(users.map(user => 
        user.id === contactUserId ? { ...user, is_contact: true } : user
      ));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="p-6 border-b border-border bg-card">
        <h2 className="text-2xl font-bold mb-4">Найти друзей</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Icon
              name="Search"
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Введите username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 bg-secondary/50 border-0"
              disabled={searching}
            />
          </div>
          <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
            {searching ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Поиск...
              </>
            ) : (
              'Найти'
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        {users.length === 0 && !searching && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <Icon name="Users" size={64} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg">Введите username для поиска</p>
              <p className="text-sm mt-2">Найдите друзей по их имени пользователя</p>
            </div>
          </div>
        )}

        {users.length > 0 && (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all animate-fade-in"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user.online_status && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{user.full_name}</h3>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>

                  {user.is_contact ? (
                    <Button variant="secondary" size="sm" disabled className="rounded-xl">
                      <Icon name="Check" size={16} className="mr-1" />
                      В контактах
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAddContact(user.id)}
                      disabled={loading}
                      className="rounded-xl"
                    >
                      <Icon name="UserPlus" size={16} className="mr-1" />
                      Добавить
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
