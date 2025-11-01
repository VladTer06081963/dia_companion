import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { HealthRecord, LabResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const textModel = 'gemini-2.5-flash';
const proModel = 'gemini-2.5-pro';
const imageModel = 'gemini-2.5-flash-image';
const ttsModel = 'gemini-2.5-flash-preview-tts';

export const getChatResponse = async (history: { role: string; parts: { text: string }[] }[], newMessage: string): Promise<string> => {
  const chat = ai.chats.create({ model: textModel, history });
  const result = await chat.sendMessage({ message: newMessage });
  return result.text;
};

export const analyzeHealthDataWithSearch = async (records: HealthRecord[], labResults: LabResult[]): Promise<{text: string; sources: any[]}> => {
  const recentRecords = records.slice(0, 30);
  const recentLabResults = labResults
    .filter(lr => lr.fileType.startsWith('image/'))
    .slice(0, 3); // Use last 3 image-based lab results for analysis

  const prompt = `
    Проанализируй следующие данные о здоровье пациента с диабетом. Данные включают записи из дневника (глюкоза, давление) и прикрепленные изображения анализов (крови, мочи).

    **Часть 1: Данные из дневника (отсортированы по дате):**
    ${JSON.stringify(recentRecords, null, 2)}
    
    **Часть 2: Изображения анализов:**
    Приложены ${recentLabResults.length} файла с анализами. Внимательно изучи их.
    Для диабетика ищи ключевые показатели, такие как:
    - В анализе крови: Гликированный гемоглобин (HbA1c), глюкоза натощак, креатинин, холестерин (ЛПНП, ЛПВП).
    - В анализе мочи: Глюкоза, кетоны, белок (микроальбуминурия).
    
    **Задание:**
    Основываясь на ВСЕХ предоставленных данных (дневник + анализы) и актуальной медицинской информации из веба, предоставь краткий, но емкий анализ и общие рекомендации по трем направлениям:
    1.  **Медицинские аспекты:** Сопоставь данные из дневника и анализов. Есть ли опасные тенденции или несоответствия? На что обратить особое внимание? (Не ставь диагноз и не давай конкретных медицинских советов, только общие наблюдения).
    2.  **Питание:** Какие общие рекомендации по питанию можно дать, основываясь на колебаниях уровня глюкозы и данных из анализов?
    3.  **Физические нагрузки:** Какие виды активности могут быть полезны, учитывая общую картину?
    
    Ответ должен быть структурированным, в формате Markdown. Будь краток и ясен.
    **Важно:** В конце обязательно укажи, что эта информация не заменяет консультацию врача и является лишь предварительным анализом.
  `;

  const textPart = { text: prompt };
  const imageParts = recentLabResults.map(lr => ({
    inlineData: {
      data: lr.fileContent,
      mimeType: lr.fileType
    }
  }));

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: proModel, // Use a powerful multimodal model that supports search
    contents: { parts: [textPart, ...imageParts] },
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

  return { text: response.text, sources };
};

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType,
        },
    };
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: [imagePart, textPart] },
    });

    return response.text;
};


export const getTextToSpeech = async (text: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: ttsModel,
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
};

// --- Audio Helper Functions as per guidelines ---
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


export const playAudio = async (base64Audio: string) => {
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const decodedBytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(decodedBytes, outputAudioContext, 24000, 1);
    const source = outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputAudioContext.destination);
    source.start();
};