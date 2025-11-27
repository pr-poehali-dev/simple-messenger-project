import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface AuthFormProps {
  onAuthSuccess: (user: any, token: string) => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/40948a89-3432-4605-a5f9-35136c548435', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      toast({
        title: 'Успешный вход!',
        description: `Добро пожаловать, ${data.user.full_name}`,
      });

      onAuthSuccess(data.user, data.session_token);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Ошибка входа',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/dc3eb796-59be-4969-b6cf-9f102054d285', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка регистрации');
      }

      toast({
        title: 'Регистрация успешна!',
        description: `Добро пожаловать, ${data.user.full_name}`,
      });

      onAuthSuccess(data.user, data.session_token);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Ошибка регистрации',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Icon name="MessageSquare" size={32} className="text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {isLogin ? 'Вход в мессенджер' : 'Регистрация'}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? 'Введите свои данные для входа'
              : 'Создайте аккаунт, чтобы начать общение'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Имя пользователя или email</Label>
                <Input
                  id="login-username"
                  type="text"
                  placeholder="username"
                  value={loginData.username}
                  onChange={(e) =>
                    setLoginData({ ...loginData, username: e.target.value })
                  }
                  required
                  disabled={loading}
                  className="bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Пароль</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  required
                  disabled={loading}
                  className="bg-secondary/50"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Вход...
                  </>
                ) : (
                  'Войти'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-fullname">Полное имя</Label>
                <Input
                  id="register-fullname"
                  type="text"
                  placeholder="Иван Иванов"
                  value={registerData.full_name}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, full_name: e.target.value })
                  }
                  required
                  disabled={loading}
                  className="bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-username">Имя пользователя</Label>
                <Input
                  id="register-username"
                  type="text"
                  placeholder="ivan_ivanov"
                  value={registerData.username}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, username: e.target.value })
                  }
                  required
                  disabled={loading}
                  className="bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="ivan@example.com"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, email: e.target.value })
                  }
                  required
                  disabled={loading}
                  className="bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Пароль</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, password: e.target.value })
                  }
                  required
                  disabled={loading}
                  className="bg-secondary/50"
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Регистрация...
                  </>
                ) : (
                  'Создать аккаунт'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
              className="text-sm"
            >
              {isLogin ? (
                <>
                  Нет аккаунта? <span className="ml-1 text-primary">Зарегистрироваться</span>
                </>
              ) : (
                <>
                  Уже есть аккаунт? <span className="ml-1 text-primary">Войти</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
