import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import AuthForm from '@/components/AuthForm';
import ContactSearch from '@/components/ContactSearch';

type Section = 'chats' | 'groups' | 'channels' | 'contacts' | 'profile' | 'settings';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

export default function Index() {
  const [activeSection, setActiveSection] = useState<Section>('chats');
  const [selectedChatId, setSelectedChatId] = useState<string>();
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('session_token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setSessionToken(storedToken);
    }
  }, []);

  const handleAuthSuccess = (userData: User, token: string) => {
    setUser(userData);
    setSessionToken(token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('session_token', token);
    setActiveSection('chats');
  };

  const handleLogout = () => {
    setUser(null);
    setSessionToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('session_token');
  };

  if (!user || !sessionToken) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      {activeSection === 'chats' && (
        <>
          <ChatList onChatSelect={setSelectedChatId} selectedChatId={selectedChatId} />
          <ChatWindow chatId={selectedChatId} />
        </>
      )}

      {activeSection === 'groups' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-2xl mb-2">👥</p>
            <p className="text-lg">Раздел "Группы"</p>
            <p className="text-sm mt-2">Скоро здесь появятся ваши группы</p>
          </div>
        </div>
      )}

      {activeSection === 'channels' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-2xl mb-2">📡</p>
            <p className="text-lg">Раздел "Каналы"</p>
            <p className="text-sm mt-2">Скоро здесь появятся ваши каналы</p>
          </div>
        </div>
      )}

      {activeSection === 'contacts' && (
        <ContactSearch currentUserId={user.id} />
      )}

      {activeSection === 'profile' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground p-8">
            <div className="mb-6">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary">
                  {user.full_name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{user.full_name}</h2>
              <p className="text-sm text-muted-foreground mb-1">@{user.username}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 transition-colors"
            >
              Выйти из аккаунта
            </button>
          </div>
        </div>
      )}

      {activeSection === 'settings' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-2xl mb-2">⚙️</p>
            <p className="text-lg">Раздел "Настройки"</p>
            <p className="text-sm mt-2">Скоро здесь появятся настройки</p>
          </div>
        </div>
      )}
    </div>
  );
}