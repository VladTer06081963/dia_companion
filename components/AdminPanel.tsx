import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { getAllUsers, deleteUserAndData } from '../services/dbService';
import { Trash2, User as UserIcon, Shield } from 'lucide-react';

interface AdminPanelProps {
    currentUser: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const allUsers = await getAllUsers();
            setUsers(allUsers);
        } catch (err) {
            setError('Не удалось загрузить список пользователей.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDeleteUser = async (userEmail: string) => {
        if (userEmail === currentUser.email) {
            alert('Вы не можете удалить свою собственную учетную запись.');
            return;
        }
        if (window.confirm(`Вы уверены, что хотите удалить пользователя ${userEmail}? Все данные этого пользователя будут безвозвратно удалены.`)) {
            try {
                await deleteUserAndData(userEmail);
                alert(`Пользователь ${userEmail} и все его данные были успешно удалены.`);
                fetchUsers(); // Refresh the list
            } catch (err) {
                alert('Не удалось удалить пользователя.');
                console.error(err);
            }
        }
    };

    if (isLoading) {
        return <div className="text-center p-8">Загрузка пользователей...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">Панель администратора</h1>
            <p className="mb-6 text-slate-600 dark:text-slate-400">Всего пользователей: {users.length}</p>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3">Роль</th>
                            <th scope="col" className="px-6 py-3">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.email} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}`}>
                                         {user.role === 'admin' ? <Shield size={14} className="mr-1" /> : <UserIcon size={14} className="mr-1" />}
                                        {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={() => handleDeleteUser(user.email)}
                                        disabled={user.email === currentUser.email}
                                        className="text-red-500 hover:text-red-700 transition-colors disabled:text-slate-400 disabled:cursor-not-allowed"
                                        aria-label={`Удалить пользователя ${user.email}`}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPanel;