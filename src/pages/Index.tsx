import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';

type Section = 'chats' | 'groups' | 'channels' | 'contacts' | 'profile' | 'settings';

export default function Index() {
  const [activeSection, setActiveSection] = useState<Section>('chats');
  const [selectedChatId, setSelectedChatId] = useState<string>();

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-2xl mb-2">📞</p>
            <p className="text-lg">Раздел "Контакты"</p>
            <p className="text-sm mt-2">Скоро здесь появятся ваши контакты</p>
          </div>
        </div>
      )}

      {activeSection === 'profile' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-2xl mb-2">👤</p>
            <p className="text-lg">Раздел "Профиль"</p>
            <p className="text-sm mt-2">Скоро здесь появится ваш профиль</p>
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
