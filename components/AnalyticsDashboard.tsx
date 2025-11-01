
import React, { useState, useMemo } from 'react';
import { HealthRecord } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyzeHealthDataWithSearch, playAudio, getTextToSpeech } from '../services/geminiService';
import ImageAnalyzer from './ImageAnalyzer';
import { Loader2, Volume2, FileText } from 'lucide-react';

interface AnalyticsDashboardProps {
  records: HealthRecord[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ records }) => {
  const [analysis, setAnalysis] = useState<{text: string; sources: any[]}|null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const chartData = useMemo(() => {
    return [...records]
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
      .map(r => ({
        ...r,
        name: new Date(r.datetime).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      }));
  }, [records]);

  const handleAnalyze = async () => {
    if (records.length < 3) {
      alert("Нужно как минимум 3 записи для анализа.");
      return;
    }
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeHealthDataWithSearch(records);
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Не удалось выполнить анализ. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async () => {
    if (!analysis || !analysis.text) return;
    setIsSpeaking(true);
    try {
        const audio = await getTextToSpeech(analysis.text);
        if (audio) {
            await playAudio(audio);
        }
    } catch (error) {
        console.error("TTS failed:", error);
        alert("Не удалось воспроизвести аудио.");
    } finally {
        setIsSpeaking(false);
    }
  };


  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Графики показателей</h2>
        {records.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-center text-slate-700 dark:text-slate-300">Динамика глюкозы</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[2, 20]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="glucose" name="Глюкоза" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-center text-slate-700 dark:text-slate-300">Динамика давления</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[40, 200]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="systolic" name="Систолическое" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="diastolic" name="Диастолическое" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">Недостаточно данных для построения графиков.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">AI-Анализ и Рекомендации</h2>
            <button
              onClick={handleAnalyze}
              disabled={isLoading || records.length < 3}
              className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform duration-150 active:scale-95 shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <FileText className="mr-2" />}
              {isLoading ? 'Анализирую...' : 'Сгенерировать анализ данных'}
            </button>
            {analysis && (
              <div className="mt-4 prose prose-slate dark:prose-invert max-w-none">
                <div className="flex justify-end">
                    <button onClick={handleSpeak} disabled={isSpeaking} className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-slate-400">
                        {isSpeaking ? <Loader2 className="animate-spin" /> : <Volume2 />}
                    </button>
                </div>
                <div dangerouslySetInnerHTML={{ __html: analysis.text.replace(/\n/g, '<br />') }} />
                {analysis.sources.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-bold">Источники:</h4>
                    <ul className="list-disc pl-5 text-sm">
                      {analysis.sources.map((source, index) => (
                        <li key={index}>
                          <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{source.web?.title || 'Источник'}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <ImageAnalyzer />
      </div>

    </div>
  );
};

export default AnalyticsDashboard;
