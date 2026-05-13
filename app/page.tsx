'use client';

import { useState, useEffect } from 'react';
import Map3D from '@/components/Map3D';
import { provinces, QuizContent } from '@/lib/data';

type AppMode = 'home' | 'learn' | 'play';

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('home');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'geo' | 'hist' | 'cult' | 'ai'>('geo');
  const [xp, setXp] = useState(0);

  // Quiz State
  const [currentQuiz, setCurrentQuiz] = useState<QuizContent | null>(null);
  const [quizStatus, setQuizStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  // AI Chat State
  const [aiResponse, setAiResponse] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const selectedData = provinces.find(p => p.id === selectedId);

  // Load câu hỏi mặc định khi chọn tỉnh trong chế độ chơi
  useEffect(() => {
    if (currentMode === 'play' && selectedData && selectedData.quizPool?.length > 0) {
      const randomQuiz = selectedData.quizPool[Math.floor(Math.random() * selectedData.quizPool.length)];
      setCurrentQuiz(randomQuiz);
      setQuizStatus('idle');
    }
  }, [selectedData, currentMode]);

  // Xử lý AI Chat (Tab Trợ lý AI)
  const askAI = async (question: string) => {
    if (!question || !selectedData) return;
    setLoadingAI(true);
    setAiResponse('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat', message: question, province: selectedData.name }),
      });
      const data = await res.json();
      setAiResponse(data.text || data.error);
    } catch {
      setAiResponse('Lỗi kết nối mạng hoặc máy chủ AI.');
    }
    setLoadingAI(false);
    setCustomQuestion('');
  };

  // AI Tự động sinh câu hỏi Quiz (Đã thêm báo lỗi rõ ràng)
  const generateAIQuiz = async () => {
    if (!selectedData) return;
    setGeneratingQuiz(true);
    setQuizStatus('idle');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'quiz', message: '', province: selectedData.name }),
      });
      const data = await res.json();
      
      // Bắt lỗi nếu AI từ chối hoặc lỗi Key
      if (data.error) {
        alert("LỖI TỪ AI: " + data.error);
      } else if (data.question) {
        setCurrentQuiz(data);
      } else {
        alert("AI trả về dữ liệu không đúng định dạng. Hãy thử lại!");
      }
    } catch (error) {
      alert("Mạng yếu hoặc server AI đang bận, vui lòng thử lại!");
    }
    setGeneratingQuiz(false);
  };

  // Xử lý khi người dùng chọn đáp án
  const handleQuizAnswer = (index: number) => {
    if (!currentQuiz) return;
    if (currentQuiz.answer === index) {
      setQuizStatus('correct');
      setXp(prev => prev + 10);
    } else {
      setQuizStatus('incorrect');
    }
  };

  // ==========================================
  // GIAO DIỆN 1: TRANG CHỦ
  // ==========================================
  if (currentMode === 'home') {
    return (
      <main className="h-screen w-full bg-[#0a1128] flex flex-col items-center justify-center relative font-sans text-white">
        <div className="z-10 text-center max-w-4xl px-6">
          <div className="text-8xl mb-6 animate-bounce">🗺️</div>
          <h1 className="text-6xl font-black mb-4">Geo<span className="text-cyan-500">Nexus</span> 2026</h1>
          <p className="text-xl text-slate-400 mb-12">Nền tảng nghiên cứu tri thức Địa lý & Lịch sử toàn diện</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => setCurrentMode('learn')} className="bg-slate-800 hover:bg-cyan-600 border border-slate-600 p-8 rounded-2xl transition-all shadow-xl text-left">
              <div className="text-4xl mb-4"></div>
              <h2 className="text-2xl font-bold mb-2">Chế độ Học thuật</h2>
              <p className="text-slate-400 text-sm hover:text-cyan-100">Nghiên cứu kho dữ liệu chi tiết về Thổ nhưỡng, Khí hậu, Lịch sử và Văn hóa.</p>
            </button>
            <button onClick={() => { setCurrentMode('play'); setSelectedId(null); setCurrentQuiz(null); }} className="bg-slate-800 hover:bg-orange-600 border border-slate-600 p-8 rounded-2xl transition-all shadow-xl text-left">
              <div className="text-4xl mb-4"></div>
              <h2 className="text-2xl font-bold mb-2">Phòng Thử thách</h2>
              <p className="text-slate-400 text-sm hover:text-orange-100">Vượt qua các câu hỏi trắc nghiệm tự động sinh bằng AI để tích lũy XP.</p>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // GIAO DIỆN 2: BẢN ĐỒ (HỌC & CHƠI)
  // ==========================================
  return (
    <main className="h-screen w-full relative font-sans overflow-hidden bg-[#0a1128]">
      {/* KHU VỰC BẢN ĐỒ 3D */}
      <div className="absolute inset-0 z-0">
        <Map3D 
          selectedId={selectedId} 
          onSelectProvince={(id) => {
            setSelectedId(id);
            setActiveTab('geo');
            setAiResponse('');
          }} 
        />
      </div>

      {/* THANH ĐIỀU HƯỚNG TRÊN CÙNG */}
      <header className="absolute top-0 left-0 right-0 z-10 p-5 flex justify-between pointer-events-none">
        <button onClick={() => { setCurrentMode('home'); setSelectedId(null); }} className="bg-slate-900 text-white px-5 py-2 rounded border border-slate-700 pointer-events-auto hover:bg-red-500 font-bold transition-colors">
          ⬅ Quay lại
        </button>
        <div className="bg-slate-900 text-white px-5 py-2 rounded border border-slate-700 pointer-events-auto font-bold flex gap-4">
          <span className="text-slate-400">{currentMode === 'learn' ? 'HỌC THUẬT' : 'THỬ THÁCH'}</span>
          <span className="text-yellow-400">XP: {xp}</span>
        </div>
      </header>

      {/* TAB HỌC THUẬT (BẢNG BÊN PHẢI) */}
      {currentMode === 'learn' && selectedData && (
        <aside className="absolute right-5 top-20 bottom-5 w-[480px] bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl z-20 flex flex-col pointer-events-auto animate-slideInRight">
          <div className="p-6 border-b border-slate-700 relative">
            <button onClick={() => setSelectedId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl">×</button>
            <h2 className="text-3xl font-black text-cyan-400">{selectedData.name}</h2>
          </div>

          <div className="flex bg-slate-800">
            {[
              { id: 'geo', label: '🌍 Địa lý' },
              { id: 'hist', label: '📜 Lịch sử' },
              { id: 'cult', label: '🎭 Văn hóa' },
              { id: 'ai', label: '🤖 Trợ lý AI' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-3 text-sm font-bold ${activeTab === tab.id ? 'bg-slate-900 text-white border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-slate-200">
            {activeTab === 'geo' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700"><p className="text-sm"><strong className="text-cyan-400 block mb-1">Vị trí & Ranh giới:</strong> {selectedData.geography?.borders}</p></div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700"><p className="text-sm"><strong className="text-cyan-400 block mb-1">Đặc trưng địa hình:</strong> {selectedData.geography?.characteristics} (Cao độ: {selectedData.geography?.elevation})</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700"><strong className="text-cyan-400 block text-xs">Thổ nhưỡng</strong><span className="text-xs">{selectedData.geography?.soil} ({selectedData.geography?.soilColor})</span></div>
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700"><strong className="text-cyan-400 block text-xs">Khí hậu</strong><span className="text-xs">{selectedData.geography?.climate}</span></div>
                </div>
              </div>
            )}
            
            {activeTab === 'hist' && (
              <div className="space-y-6 animate-fadeIn">
                <div><h3 className="text-yellow-400 font-bold mb-3 border-l-4 border-yellow-400 pl-2">Cột mốc Lịch sử</h3>
                <ul className="space-y-3">{selectedData.history?.milestones.map((m, i) => <li key={i} className="text-sm bg-slate-800/50 p-3 rounded">{m}</li>)}</ul></div>
                <div><h3 className="text-red-400 font-bold mb-3 border-l-4 border-red-400 pl-2">Trận đánh tiêu biểu</h3>
                <ul className="space-y-3">{selectedData.history?.battles.map((b, i) => <li key={i} className="text-sm bg-red-950/30 border border-red-900/50 p-3 rounded">{b}</li>)}</ul></div>
              </div>
            )}

            {activeTab === 'cult' && (
              <div className="space-y-6 animate-fadeIn">
                <div><h3 className="text-purple-400 font-bold mb-3 border-l-4 border-purple-400 pl-2">Phong tục & Lễ hội</h3>
                <ul className="space-y-2">{[...(selectedData.culture?.customs || []), ...(selectedData.culture?.festivals || [])].map((c, i) => <li key={i} className="text-sm bg-slate-800/50 p-3 rounded">{c}</li>)}</ul></div>
                <div><h3 className="text-green-400 font-bold mb-3 border-l-4 border-green-400 pl-2">Ẩm thực đặc trưng</h3>
                <div className="flex flex-wrap gap-2">{selectedData.culture?.cuisine?.map((c, i) => <span key={i} className="text-xs bg-green-900/30 border border-green-700/50 px-3 py-1.5 rounded-full">{c}</span>)}</div></div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="flex flex-col h-full animate-fadeIn">
                <div className="flex-1 mb-4 bg-slate-800/50 rounded-lg p-4 overflow-y-auto border border-slate-700">
                  {aiResponse ? <p className="text-sm leading-relaxed">{aiResponse}</p> : <p className="text-sm text-slate-500 text-center mt-10">AI đã sẵn sàng trả lời các câu hỏi chuyên sâu về {selectedData.name}</p>}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={customQuestion} onChange={(e) => setCustomQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && askAI(customQuestion)} placeholder="Hỏi AI chuyên gia..." className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-sm outline-none focus:border-cyan-500" />
                  <button onClick={() => askAI(customQuestion)} disabled={loadingAI || !customQuestion} className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">{loadingAI ? '...' : 'Gửi'}</button>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* CHẾ ĐỘ THỬ THÁCH (BẢNG DƯỚI ĐÁY) */}
      {currentMode === 'play' && selectedData && currentQuiz && (
        <aside className="absolute left-1/2 bottom-8 -translate-x-1/2 w-[90%] max-w-4xl bg-slate-900/95 backdrop-blur-xl border-t-4 border-orange-500 rounded-xl shadow-2xl z-20 p-8 pointer-events-auto animate-slideUp">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-orange-400">Câu hỏi: {selectedData.name}</h2>
            <button 
              onClick={generateAIQuiz} 
              disabled={generatingQuiz}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              ✨ {generatingQuiz ? 'Đang tạo câu hỏi...' : 'Tạo câu hỏi AI mới'}
            </button>
          </div>
          
          <p className="text-2xl text-white mb-8 font-medium">{currentQuiz.question}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuiz.options.map((opt, idx) => {
              let btnClass = "p-4 rounded-lg text-lg font-bold transition-all border text-left ";
              if (quizStatus === 'idle') btnClass += "bg-slate-800 border-slate-600 text-slate-200 hover:bg-orange-600 hover:border-orange-400";
              else if (quizStatus === 'correct' && currentQuiz.answer === idx) btnClass += "bg-green-600 border-green-400 text-white";
              else if (quizStatus === 'incorrect' && currentQuiz.answer === idx) btnClass += "bg-green-600/50 border-green-400 text-white"; 
              else btnClass += "bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed";

              return (
                <button key={idx} onClick={() => handleQuizAnswer(idx)} disabled={quizStatus !== 'idle'} className={btnClass}>
                  {String.fromCharCode(65 + idx)}. {opt}
                </button>
              );
            })}
          </div>

          {quizStatus !== 'idle' && (
            <div className={`mt-6 p-4 rounded-lg border ${quizStatus === 'correct' ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'}`}>
              <p className="text-lg font-bold mb-2">{quizStatus === 'correct' ? '🎉 Xuất sắc! Bạn nhận được +10 XP.' : '❌ Rất tiếc, bạn chọn sai rồi!'}</p>
              <p className="text-slate-300 text-sm italic"><strong>Giải thích:</strong> {currentQuiz.explanation}</p>
            </div>
          )}
        </aside>
      )}

      {currentMode === 'play' && !selectedData && (
        <div className="absolute left-1/2 bottom-12 -translate-x-1/2 bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-2xl animate-pulse pointer-events-none">
          👆 Hãy click vào một tỉnh trên bản đồ để làm bài Quiz!
        </div>
      )}

      {/* HIỆU ỨNG CHUYỂN ĐỘNG */}
      <style dangerouslySetInnerHTML={{__html: `
        .animate-slideInRight { animation: slideInRight 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.2s ease-in; }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 50px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}} />
    </main>
  );
}