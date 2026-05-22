import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Power, Trash2, Pause, Play, Cpu, Wifi, HardDrive } from 'lucide-react';

interface LogMessage {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERR' | 'SYS';
  message: string;
  source: string;
}

const MOCK_LOGS = [
  "Initializing CUDA context...",
  "Loading acoustic model weights from /models/v2ProPlus...",
  "Allocating 4096MB VRAM...",
  "Audio buffer stream ready.",
  "Connected to WebSocket server ws://localhost:8080",
  "Checking integrity of phoneme dictionary...",
  "Text normalization complete.",
  "Heartbeat signal received.",
  "GPU temperature: 42°C",
  "Memory usage: 34%",
  "Starting inference engine...",
  "Module 'SoVITS' ready.",
  "Module 'GPT-Decoder' ready.",
];

const TerminalView: React.FC = () => {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);

  const addLog = (msg: string, level: 'INFO' | 'WARN' | 'ERR' | 'SYS' = 'INFO', source: string = 'CORE') => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    
    setLogs(prev => [...prev.slice(-200), {
      id: logIdRef.current++,
      timestamp: timeString,
      level,
      message: msg,
      source
    }]);
  };

  // Initial Boot Logs
  useEffect(() => {
    addLog("SYSTEM BOOT SEQUENCE INITIATED", "SYS", "BOOT");
    MOCK_LOGS.forEach((msg, i) => {
        setTimeout(() => {
            addLog(msg, "INFO", "KERNEL");
        }, i * 150);
    });
  }, []);

  // Continuous background noise logs
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
       const types: ('INFO' | 'SYS')[] = ['INFO', 'INFO', 'INFO', 'SYS'];
       const selectedType = types[Math.floor(Math.random() * types.length)];
       const sources = ['KERNEL', 'NETWORK', 'GPU_0', 'AUDIO_IO'];
       const msgs = [
           "Keep-alive packet sent.",
           "VRAM allocation stable.",
           "Processing queue check...",
           "Waiting for input stream...",
           `Vector sync: ${Math.random().toFixed(4)}ms`
       ];
       
       addLog(
           msgs[Math.floor(Math.random() * msgs.length)], 
           selectedType, 
           sources[Math.floor(Math.random() * sources.length)]
        );
    }, 2000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Auto scroll
  useEffect(() => {
    if (!isPaused && bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isPaused]);

  return (
    <div className="theme-terminal-shell flex flex-col h-full w-full rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Terminal Header */}
      <div className="theme-terminal-header h-12 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
              <div className="theme-terminal-dot-danger w-2.5 h-2.5 rounded-full" />
              <div className="theme-terminal-dot-warning w-2.5 h-2.5 rounded-full" />
              <div className="theme-terminal-dot-success w-2.5 h-2.5 rounded-full" />
              <div className="ml-3 flex items-center gap-2 text-[var(--color-gray-300)]">
                  <Terminal className="w-3 h-3" />
                  <span className="font-mono text-xs font-bold tracking-wider">ROOT@AMBER_FLUX:~</span>
              </div>
          </div>
          
          <div className="flex items-center gap-1">
               <button 
                 onClick={() => setIsPaused(!isPaused)}
                 className="theme-terminal-action p-1.5 rounded transition-colors"
               >
                 {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
               </button>
               <button 
                 onClick={() => setLogs([])}
                 className="theme-terminal-action p-1.5 rounded hover:text-[var(--color-danger-500)] transition-colors"
               >
                 <Trash2 className="w-3 h-3" />
               </button>
          </div>
      </div>

      {/* Status Bar */}
      <div className="theme-terminal-subbar px-4 py-1.5 flex items-center gap-4 text-[10px] font-mono text-[var(--color-gray-400)] uppercase tracking-widest shrink-0">
          <div className="flex items-center gap-1.5">
              <div className="theme-terminal-pulse w-1.5 h-1.5 rounded-full animate-pulse" />
              ONLINE
          </div>
          <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3" />
              12%
          </div>
           <div className="flex items-center gap-1.5">
              <HardDrive className="w-3 h-3" />
              4.2GB
          </div>
          <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3" />
              12ms
          </div>
      </div>

      {/* Logs Content */}
      <div className="theme-terminal-body flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 custom-scrollbar">
          {logs.map((log) => (
              <div key={log.id} className="theme-terminal-row flex gap-3 p-0.5 rounded transition-colors group">
                  <span className="theme-terminal-time select-none w-20 shrink-0">{log.timestamp}</span>
                  <span className={`w-10 shrink-0 font-bold ${
                      log.level === 'INFO' ? 'theme-terminal-level-info' :
                      log.level === 'WARN' ? 'theme-terminal-level-warn' :
                      log.level === 'ERR' ? 'theme-terminal-level-error' : 'theme-terminal-level-system'
                  }`}>
                      {log.level}
                  </span>
                  <span className="theme-terminal-source w-20 shrink-0 hidden sm:block">[{log.source}]</span>
                  <span className={`break-all ${log.level === 'ERR' ? 'theme-terminal-error-message' : 'theme-terminal-message'}`}>
                      {log.message}
                  </span>
              </div>
          ))}
          
          {/* Typing Cursor */}
          {!isPaused && (
              <div className="flex items-center gap-2 mt-2 animate-pulse">
                  <span className="theme-accent-text">➜</span>
                  <div className="w-1.5 h-4 bg-[rgba(182,118,24,0.5)]"></div>
              </div>
          )}
          <div ref={bottomRef} />
      </div>

    </div>
  );
};

export default TerminalView;






