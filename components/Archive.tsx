import React, { useState, useEffect, useCallback } from 'react';
import { ArchivedAnalysis, ArchivedChat, ArchivedRecordEdit, HealthRecord } from '../types';
import { getArchivedAnalyses, deleteArchivedAnalysis, getArchivedChats, deleteArchivedChat, getArchivedRecordEdits, deleteArchivedRecordEdit } from '../services/dbService';
import { ChevronDown, ChevronUp, Trash2, Bot, User, FileText, MessageSquare, History } from 'lucide-react';

const Archive: React.FC = () => {
    const [analyses, setAnalyses] = useState<ArchivedAnalysis[]>([]);
    const [chats, setChats] = useState<ArchivedChat[]>([]);
    const [edits, setEdits] = useState<ArchivedRecordEdit[]>([]);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    const loadData = useCallback(async () => {
        const [analysesData, chatsData, editsData] = await Promise.all([
            getArchivedAnalyses(), 
            getArchivedChats(),
            getArchivedRecordEdits()
        ]);
        setAnalyses(analysesData);
        setChats(chatsData);
        setEdits(editsData);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleDeleteAnalysis = async (id: string) => {
        if (window.confirm('Вы уверены, что хотите удалить этот анализ?')) {
            await deleteArchivedAnalysis(id);
            loadData();
        }
    };

    const handleDeleteChat = async (id: string) => {
        if (window.confirm('Вы уверены, что хотите удалить этот чат?')) {
            await deleteArchivedChat(id);
            loadData();
        }
    };
    
    const handleDeleteEdit = async (id: string) => {
        if (window.confirm('Вы уверены, что хотите удалить эту запись из истории?')) {
            await deleteArchivedRecordEdit(id);
            loadData();
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => ({...prev, [id]: !prev[id]}));
    };

    const formatDateTime = (isoString: string) => {
        return new Date(isoString).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    const renderValue = (value?: number, unit?: string) => value !== undefined ? `${value}${unit || ''}` : '—';
    const renderPressure = (record: HealthRecord) => (record.systolic !== undefined && record.diastolic !== undefined) ? `${record.systolic}/${record.diastolic}` : '—';

    const AnalysisItem: React.FC<{item: ArchivedAnalysis}> = ({item}) => {
        const isExpanded = expandedItems[item.id];
        return (
            <li className="bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-sm transition-all duration-300">
                <div 
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => toggleExpand(item.id)}
                >
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <FileText className="text-green-500 flex-shrink-0" size={24} />
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">AI-Анализ</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateTime(item.datetime)}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={(e) => {e.stopPropagation(); handleDeleteAnalysis(item.id)}} className="text-red-500 hover:text-red-700 transition-colors">
                            <Trash2 size={18} />
                        </button>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </div>
                {isExpanded && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="prose prose-slate dark:prose-invert max-w-none text-sm">
                            <div dangerouslySetInnerHTML={{ __html: item.analysis.text.replace(/\n/g, '<br />') }} />
                             {item.analysis.sources.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-bold">Источники:</h4>
                                    <ul className="list-disc pl-5">
                                    {item.analysis.sources.map((source, index) => (
                                        <li key={index}>
                                        <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{source.web?.title || 'Источник'}</a>
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </li>
        );
    };
    
    const ChatItem: React.FC<{item: ArchivedChat}> = ({item}) => {
        const isExpanded = expandedItems[item.id];
        const firstUserMessage = item.messages.find(m => m.role === 'user')?.text;
        return (
            <li className="bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-sm transition-all duration-300">
                 <div 
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => toggleExpand(item.id)}
                >
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <MessageSquare className="text-blue-500 flex-shrink-0" size={24} />
                        <div className="overflow-hidden">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{firstUserMessage || 'Сохраненный чат'}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateTime(item.datetime)}</p>
                        </div>
                    </div>
                     <div className="flex items-center space-x-4">
                        <button onClick={(e) => {e.stopPropagation(); handleDeleteChat(item.id)}} className="text-red-500 hover:text-red-700 transition-colors">
                            <Trash2 size={18} />
                        </button>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </div>
                {isExpanded && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto space-y-4">
                        {item.messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white"><Bot size={20} /></div>}
                                <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                                <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}/>
                                </div>
                                {msg.role === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center text-white"><User size={20} /></div>}
                            </div>
                        ))}
                    </div>
                )}
            </li>
        )
    };

    const EditHistoryItem: React.FC<{item: ArchivedRecordEdit}> = ({ item }) => {
        const isExpanded = expandedItems[item.id];
        return (
            <li className="bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-sm transition-all duration-300">
                <div 
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => toggleExpand(item.id)}
                >
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <History className="text-purple-500 flex-shrink-0" size={24} />
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">Запись изменена</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateTime(item.datetime)}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteEdit(item.id) }} className="text-red-500 hover:text-red-700 transition-colors">
                            <Trash2 size={18} />
                        </button>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </div>
                {isExpanded && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-sm">
                        <p className="mb-2 text-slate-600 dark:text-slate-300">Исходная запись от: <span className="font-medium">{formatDateTime(item.originalRecord.datetime)}</span></p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                                <h4 className="font-bold mb-2 text-red-700 dark:text-red-400">Было</h4>
                                <p><strong>Глюкоза:</strong> {renderValue(item.originalRecord.glucose, ' ммоль/л')}</p>
                                <p><strong>Давление:</strong> {renderPressure(item.originalRecord)}</p>
                                <p className="mt-1 italic text-xs truncate"><strong>Комм:</strong> {item.originalRecord.comment || '—'}</p>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                                <h4 className="font-bold mb-2 text-green-700 dark:text-green-400">Стало</h4>
                                <p><strong>Глюкоза:</strong> {renderValue(item.updatedRecord.glucose, ' ммоль/л')}</p>
                                <p><strong>Давление:</strong> {renderPressure(item.updatedRecord)}</p>
                                <p className="mt-1 italic text-xs truncate"><strong>Комм:</strong> {item.updatedRecord.comment || '—'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </li>
        );
    };

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">История изменений записей</h2>
                 {edits.length > 0 ? (
                    <ul className="space-y-4">
                        {edits.map(item => <EditHistoryItem key={item.id} item={item} />)}
                    </ul>
                ) : (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-8">Нет записей об изменениях.</p>
                )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Архив анализов</h2>
                    {analyses.length > 0 ? (
                        <ul className="space-y-4">
                            {analyses.map(item => <AnalysisItem key={item.id} item={item} />)}
                        </ul>
                    ) : (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-8">Нет сохраненных анализов.</p>
                    )}
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Архив чатов</h2>
                    {chats.length > 0 ? (
                         <ul className="space-y-4">
                            {chats.map(item => <ChatItem key={item.id} item={item} />)}
                        </ul>
                    ) : (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-8">Нет сохраненных чатов.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Archive;