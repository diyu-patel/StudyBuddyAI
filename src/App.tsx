import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Image as ImageIcon, 
  Send, 
  Loader2, 
  X, 
  Sparkles,
  FileText,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  Camera,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Language, StudyContent } from './types';
import { generateStudyContent, generateTopicImage } from './services/geminiService';

const translations = {
  English: {
    title: "StudyBuddy AI",
    subtitle: "What are you studying?",
    placeholder: "Ask a question, enter a topic, or upload an image of your notes...",
    uploadBtn: "Upload Image",
    generateBtn: "Generate Notes",
    generating: "Generating...",
    quickTips: "Quick Tips",
    tip1: "Upload photos of textbook pages for instant summaries.",
    tip2: "Ask specific questions for detailed explanations.",
    tip3: "Switch languages to study in your preferred medium.",
    readyTitle: "Ready to help you learn",
    readyDesc: "Enter a topic or question on the left to generate comprehensive study materials.",
    answer: "Answer",
    explanation: "Detailed Explanation",
    keyNotes: "Key Notes",
    summary: "Summary",
    clear: "Clear",
    visuals: "Visual Aids",
    chart: "Data Visualization",
    cameraBtn: "Click Picture",
    captureBtn: "Capture",
    cancelBtn: "Cancel",
    newQuestion: "New Question"
  },
  Hindi: {
    title: "स्टडीबडी AI",
    subtitle: "आप क्या पढ़ रहे हैं?",
    placeholder: "प्रश्न पूछें, विषय दर्ज करें, या अपने नोट्स की छवि अपलोड करें...",
    uploadBtn: "छवि अपलोड करें",
    generateBtn: "नोट्स बनाएं",
    generating: "बना रहा है...",
    quickTips: "त्वरित सुझाव",
    tip1: "त्वरित सारांश के लिए पाठ्यपुस्तक के पन्नों की तस्वीरें अपलोड करें।",
    tip2: "विस्तृत स्पष्टीकरण के लिए विशिष्ट प्रश्न पूछें।",
    tip3: "अपने पसंदीदा माध्यम में अध्ययन करने के लिए भाषाएं बदलें।",
    readyTitle: "सीखने में मदद के लिए तैयार",
    readyDesc: "व्यापक अध्ययन सामग्री उत्पन्न करने के लिए बाईं ओर एक विषय या प्रश्न दर्ज करें।",
    answer: "उत्तर",
    explanation: "विस्तृत व्याख्या",
    keyNotes: "मुख्य नोट्स",
    summary: "सारांश",
    clear: "साफ करें",
    visuals: "दृश्य सहायता",
    chart: "डेटा विज़ुअलाइज़ेशन",
    cameraBtn: "फोटो खींचें",
    captureBtn: "कैપ्चर करें",
    cancelBtn: "रद्द करें",
    newQuestion: "नया प्रश्न"
  },
  Gujarati: {
    title: "સ્ટડીબડી AI",
    subtitle: "તમે શું ભણી રહ્યા છો?",
    placeholder: "પ્રશ્ન પૂછો, વિષય દાખલ કરો અથવા તમારા નોટ્સની છબી અપલોડ કરો...",
    uploadBtn: "છબી અપલોડ કરો",
    generateBtn: "નોટ્સ બનાવો",
    generating: "બનાવી રહ્યું છે...",
    quickTips: "ઝડપી ટિપ્સ",
    tip1: "ઝડપી સારાંશ માટે પાઠ્યપુસ્તકના પાનાના ફોટા અપલોડ કરો.",
    tip2: "વિગતવાર સમજૂતી માટે ચોક્કસ પ્રશ્નો પૂછો.",
    tip3: "તમારા મનપસંદ માધ્યમમાં અભ્યાસ કરવા માટે ભાષાઓ બદલો.",
    readyTitle: "શીખવામાં મદદ કરવા માટે તૈયાર",
    readyDesc: "વ્યાપક અભ્યાસ સામગ્રી જનરેટ કરવા માટે ડાબી બાજુએ વિષય અથવા પ્રશ્ન દાખલ કરો.",
    answer: "જવાબ",
    explanation: "વિગતવાર સમજૂતી",
    keyNotes: "મુખ્ય નોટ્સ",
    summary: "સારાંશ",
    clear: "સાફ કરો",
    visuals: "દ્રશ્ય સહાય",
    chart: "ડેટા વિઝ્યુલાઇઝેશન",
    cameraBtn: "ફોટો પાડો",
    captureBtn: "કેપ્ચર",
    cancelBtn: "રદ કરો",
    newQuestion: "નવો પ્રશ્ન"
  }
};

export default function App() {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('English');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudyContent | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const t = translations[language];

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input && !image) return;

    setLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const data = await generateStudyContent(input, language, image || undefined);
      setResult(data);
      
      // Generate topic image in background
      if (data.imagePrompt) {
        generateTopicImage(data.imagePrompt)
          .then(setGeneratedImage)
          .catch(console.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setInput('');
    setImage(null);
    setResult(null);
    setGeneratedImage(null);
    setError(null);
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <BookOpen size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#F0F0F0] p-1 rounded-lg">
              {(['English', 'Hindi', 'Gujarati'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    language === lang 
                      ? 'bg-white text-emerald-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-black/5 p-6"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-500" />
                {t.subtitle}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t.placeholder}
                    className="w-full h-40 p-4 bg-[#F9F9F9] border border-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none text-sm leading-relaxed"
                  />
                </div>

                {image && (
                  <div className="relative group">
                    <img 
                      src={image} 
                      alt="Uploaded study material" 
                      className="w-full h-48 object-cover rounded-xl border border-black/5"
                    />
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#F0F0F0] hover:bg-[#E5E5E5] text-gray-700 font-medium rounded-xl transition-colors"
                    >
                      <ImageIcon size={18} />
                      <span>{t.uploadBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#F0F0F0] hover:bg-[#E5E5E5] text-gray-700 font-medium rounded-xl transition-colors"
                    >
                      <Camera size={18} />
                      <span>{t.cameraBtn}</span>
                    </button>
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <button
                    type="submit"
                    disabled={loading || (!input && !image)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <Send size={18} />
                        <span>{t.generateBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <AnimatePresence>
                {isCameraActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                  >
                    <div className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl">
                      <div className="relative aspect-video bg-black">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                      <div className="p-4 flex gap-3">
                        <button
                          onClick={capturePhoto}
                          className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
                        >
                          {t.captureBtn}
                        </button>
                        <button
                          onClick={stopCamera}
                          className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                          {t.cancelBtn}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}
            </motion.div>

            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
              <h3 className="text-emerald-800 font-semibold mb-2 flex items-center gap-2">
                <Lightbulb size={18} />
                {t.quickTips}
              </h3>
              <ul className="text-emerald-700 text-sm space-y-2">
                <li className="flex gap-2">
                  <ChevronRight size={14} className="mt-1 shrink-0" />
                  <span>{t.tip1}</span>
                </li>
                <li className="flex gap-2">
                  <ChevronRight size={14} className="mt-1 shrink-0" />
                  <span>{t.tip2}</span>
                </li>
                <li className="flex gap-2">
                  <ChevronRight size={14} className="mt-1 shrink-0" />
                  <span>{t.tip3}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 pb-12"
                >
                  {/* Answer Card */}
                  <section className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                    <div className="bg-emerald-500 px-6 py-4 flex items-center justify-between">
                      <h3 className="text-white font-bold flex items-center gap-2">
                        <CheckCircle2 size={20} />
                        {t.answer}
                      </h3>
                      <button 
                        onClick={clearAll}
                        className="text-white/80 hover:text-white text-sm font-medium"
                      >
                        {t.clear}
                      </button>
                    </div>
                    <div className="p-6">
                      <p className="text-lg leading-relaxed font-medium text-gray-800">
                        {result.answer}
                      </p>
                    </div>
                  </section>

                  {/* Generated Image Card */}
                  {generatedImage && (
                    <section className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-600">
                        <ImageIcon size={20} />
                        {t.visuals}
                      </h3>
                      <img 
                        src={generatedImage} 
                        alt="Topic illustration" 
                        className="w-full h-auto rounded-xl shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    </section>
                  )}

                  {/* Chart Card */}
                  {result.chartData && result.chartData.length > 0 && (
                    <section className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-600">
                        <BarChart3 size={20} />
                        {result.chartTitle || t.chart}
                      </h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={result.chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="label" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 12, fill: '#666' }}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 12, fill: '#666' }}
                            />
                            <Tooltip 
                              cursor={{ fill: 'transparent' }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {result.chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                  )}

                  {/* Explanation Card */}
                  <section className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-600">
                      <FileText size={20} />
                      {t.explanation}
                    </h3>
                    <div className="prose prose-emerald max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {result.explanation}
                      </p>
                    </div>
                  </section>

                  {/* Key Notes Grid */}
                  <section className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-600">
                      <Sparkles size={20} />
                      {t.keyNotes}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.keyNotes.map((note, i) => (
                        <div key={i} className="flex gap-3 p-3 bg-[#F9F9F9] rounded-xl border border-black/5">
                          <span className="flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-sm text-gray-700">{note}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Summary Card */}
                  <section className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-600">
                      <BookOpen size={20} />
                      {t.summary}
                    </h3>
                    <div className="space-y-3">
                      {result.summary.map((point, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="mt-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                          <p className="text-sm text-gray-700 leading-relaxed">{point}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* New Question Button */}
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={clearAll}
                      className="flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 group"
                    >
                      <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                      <span>{t.newQuestion}</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white/50 rounded-3xl border-2 border-dashed border-black/5"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                    <BookOpen size={40} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700">{t.readyTitle}</h3>
                  <p className="text-gray-500 max-w-xs mt-2">
                    {t.readyDesc}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
