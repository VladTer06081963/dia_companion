
import React, { useState } from 'react';
import { analyzeImage } from '../services/geminiService';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

const ImageAnalyzer: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Проанализируй это блюдо с точки зрения диабетика. Оцени примерное количество углеводов, белков и жиров. Дай рекомендации, подходит ли это блюдо для рациона.');
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
      setResult('');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!image) {
      setError('Пожалуйста, выберите изображение.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResult('');
    try {
      const imageBase64 = await fileToBase64(image);
      const analysisResult = await analyzeImage(prompt, imageBase64, image.type);
      setResult(analysisResult);
    } catch (err) {
      console.error("Image analysis failed:", err);
      setError('Не удалось проанализировать изображение. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Анализатор еды по фото</h2>
      <div className="flex-grow space-y-4">
        <div>
          <label htmlFor="image-upload" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Загрузите фото</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {preview ? (
                <img src={preview} alt="Preview" className="mx-auto h-32 w-auto object-cover rounded-md" />
              ) : (
                <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
              )}
              <div className="flex text-sm text-slate-600 dark:text-slate-400">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>Выберите файл</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                </label>
                <p className="pl-1">или перетащите сюда</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG, GIF до 10MB</p>
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Запрос для анализа</label>
          <textarea
            id="prompt"
            rows={4}
            className="w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-200 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading || !image}
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform duration-150 active:scale-95 shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />}
          {isLoading ? 'Анализирую...' : 'Анализировать фото'}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {result && (
          <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-md prose prose-slate dark:prose-invert max-w-none text-sm">
             <div dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalyzer;
