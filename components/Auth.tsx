import React, { useState } from 'react';
import { User } from '../types';
import { addUser, getUser } from '../services/dbService';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const user = await getUser(email, password);
        if (user) {
          onAuthSuccess(user);
        } else {
          setError('Неверный email или пароль.');
        }
      } else {
        // FIX: The `addUser` function assigns a default role. The explicit `User` type annotation
        // was removed to match the `Omit<User, 'role'>` type expected by `addUser`.
        const newUser = { email, password };
        await addUser(newUser);
        alert('Регистрация прошла успешно! Теперь вы можете войти.');
        setIsLogin(true); // Switch to login form after registration
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="w-full max-w-md">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 text-center mb-6">
                DiaCompanion
            </h1>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-center text-slate-800 dark:text-slate-100">
                    {isLogin ? 'Вход' : 'Регистрация'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border rounded-md shadow-sm bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-slate-700 dark:text-slate-300">Пароль</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border rounded-md shadow-sm bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                     {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400"
                        >
                            {isLoading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
                        </button>
                    </div>
                </form>
                <div className="mt-6 text-center">
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                        {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                    </button>
                </div>
            </div>
             <footer className="text-center py-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
                <p>Это приложение не является медицинским устройством. Всегда консультируйтесь с врачом.</p>
             </footer>
        </div>
    </div>
  );
};

export default Auth;