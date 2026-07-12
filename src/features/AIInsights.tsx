/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  Sparkles, Send, BrainCircuit, ShieldAlert, 
  HelpCircle, CheckCircle2, ChevronRight, Activity, Thermometer 
} from 'lucide-react';

interface ChatMessage {
  sender: 'USER' | 'AI';
  text: string;
  time: string;
}

export default function AIInsights() {
  const { instruments, notifications, qcResults } = useLab();

  // Chatbot states
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'AI', text: 'Greetings! I am the LabPulse Copilot. I scan live sensor streams, peak tables, and maintenance diaries to suggest preventative calibration steps. What can I inspect for you today?', time: new Date().toLocaleTimeString().substring(0, 5) }
  ]);
  const [userInput, setUserInput] = useState('');

  const [aiSuggestions, setAiSuggestions] = useState([
    { id: 1, title: 'GC-01 Column Bake-out Advised', desc: 'Shimadzu GC-01 shows a baseline drift of +4.2% over the last 3 runs. We recommend running an overnight column bake-out at 280°C to strip volatile residual standard matrices.', type: 'MAINTENANCE' },
    { id: 2, title: 'HPLC-01 Lamp Wear Warning', desc: 'Agilent 1260 Deuterium lamp hours stand at 1,420 hours. Wavelength intensity holds within compliance limits, but we suggest purchasing a replacement bulb now to minimize down-time.', type: 'PREDICTION' },
    { id: 3, title: 'UHPLC-02 Column Backpressure Check', desc: 'Waters ACQUITY backpressure has spiked to 1042 bar under a 0.5 mL/min flow rate, indicating possible frit clog. Suggest flushing with 10% IPA/Water.', type: 'ANOMALY' }
  ]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput) return;

    const userMsg: ChatMessage = {
      sender: 'USER',
      text: userInput,
      time: new Date().toLocaleTimeString().substring(0, 5)
    };

    setMessages(prev => [...prev, userMsg]);
    const query = userInput.toLowerCase();
    setUserInput('');

    // Custom reactive AI chatbot responses based on user keyword queries
    setTimeout(() => {
      let aiText = "I have analyzed that query against LIMS guidelines. We recommend verifying system suitability coefficients, especially peak integration tailing bounds and theoretical plate heights, to prevent FDA audit non-conformities.";
      
      if (query.includes('pressure') || query.includes('clog')) {
        aiText = "Spikes in chromatography backpressure usually point to particulate accumulation on the column inlet frit. I recommend reversing the column flow briefly or flushing it with HPLC-grade Isopropanol (IPA) at 0.1 mL/min overnight to clear polar matrices.";
      } else if (query.includes('tailing') || query.includes('fronting')) {
        aiText = "Peak tailing factors (USP T > 1.20) are often caused by secondary silanol interactions or void volumes at the column head. Adding a trace buffer modifier like Trifluoroacetic Acid (TFA) or utilizing a modern bridged ethyl hybrid (BEH) column usually restores peak symmetry.";
      } else if (query.includes('health') || query.includes('failure')) {
        aiText = "Scanning active assets... All online instrument nodes display excellent health scores (Mean: 94%), with the exception of Thermo Vanquish (UHPLC-02) which logged a leak interlock failure. Seals and proportioning valves are functioning normally on HPLC-01.";
      } else if (query.includes('maintenance') || query.includes('lamp')) {
        aiText = "Agilent 1260 HPLC-01 preventative maintenance countdown is at 18 days. The deuterium lamp has completed 1,420 hours of service, which is within its standard 2,000-hour operational specification. No immediate replacement is required.";
      }

      const aiMsg: ChatMessage = {
        sender: 'AI',
        text: aiText,
        time: new Date().toLocaleTimeString().substring(0, 5)
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  const loadPrompt = (prompt: string) => {
    setUserInput(prompt);
  };

  return (
    <div className="space-y-6" id="ai-insights-module">
      {/* Upper header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
        <Sparkles className="h-6 w-6 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">LabPulse AI Copilot & Predictive Failure Core</h1>
          <p className="text-xs text-slate-500">Autonomous chromatogram diagnostics, pump wear alerts, and Westgard SPC checks.</p>
        </div>
      </div>

      {/* Main Grid: AI Suggestions on Left, Interactive Chatbot on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" id="ai-main-grid">
        
        {/* Left Column: AI Suggestions (2 cols) */}
        <div className="lg:col-span-2 space-y-4" id="ai-suggestions-panel">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Autonomous Telemetry Scanner</span>
          
          <div className="space-y-3">
            {aiSuggestions.map(sug => {
              let alertClass = "bg-indigo-50/50 border-indigo-100 text-indigo-800";
              if (sug.type === 'ANOMALY') alertClass = "bg-rose-50 border-rose-100 text-rose-900";
              else if (sug.type === 'PREDICTION') alertClass = "bg-amber-50 border-amber-100 text-amber-900";

              return (
                <div key={sug.id} className={`p-4 rounded-xl border flex gap-3 text-xs flex-col ${alertClass}`} id={`sug-${sug.id}`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    <BrainCircuit className="h-4 w-4 shrink-0 text-indigo-600" />
                    <span>{sug.title}</span>
                  </div>
                  <p className="opacity-95 leading-normal">{sug.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Copilot Chatbot (3 cols) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px] justify-between" id="ai-chatbot-card">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BrainCircuit className="h-5 w-5 text-indigo-500" />
            <div>
              <h3 className="text-xs font-bold text-slate-900">LabPulse AI Assistant</h3>
              <p className="text-[10px] text-slate-400 font-mono">Model: Antigravity-LIMS v1.2 • Active</p>
            </div>
          </div>

          {/* Messages board */}
          <div className="flex-1 my-4 overflow-y-auto space-y-3.5 pr-1 text-xs" id="chat-messages-stage">
            {messages.map((msg, idx) => {
              const isAI = msg.sender === 'AI';
              return (
                <div key={idx} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                  <div className={`p-3.5 rounded-xl max-w-md space-y-1 ${
                    isAI 
                      ? 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-150' 
                      : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}>
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className={`block text-[9px] text-right font-mono ${isAI ? 'text-slate-400' : 'text-indigo-200'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Quick Queries triggers */}
          <div className="flex flex-wrap items-center gap-1.5 pb-3">
            <button 
              onClick={() => loadPrompt('How do I reduce peak tailing on my column?')}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 text-[10px] text-slate-600 transition-colors"
            >
              Reduce Peak Tailing
            </button>
            <button 
              onClick={() => loadPrompt('Predict upcoming pump maintenance events')}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 text-[10px] text-slate-600 transition-colors"
            >
              Predict Pump Maintenance
            </button>
            <button 
              onClick={() => loadPrompt('Waters ACQUITY backpressure spikes help')}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 text-[10px] text-slate-600 transition-colors"
            >
              Backpressure spikes
            </button>
          </div>

          {/* Form input */}
          <form onSubmit={handleChatSubmit} className="flex gap-2 border-t border-slate-100 pt-3">
            <input
              type="text"
              placeholder="Ask the AI copilot about peaks anomalies, columns degradation..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 p-2 bg-slate-50 rounded-lg text-xs outline-none border border-slate-200 focus:bg-white focus:border-indigo-500 transition-all"
            />
            <button 
              type="submit"
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
