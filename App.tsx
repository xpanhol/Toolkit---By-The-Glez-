import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  Type, 
  Maximize, 
  Trash2, 
  FolderInput, 
  Palette, 
  PenTool,
  Zap,
  Info,
  Download,
  X
} from 'lucide-react';
import { ScriptTool } from './types';
import { runAeScript, openUrl } from './services/aeService';
import { projectFiles } from './utils/projectData';

// Tool Definition
const tools: ScriptTool[] = [
  {
    id: 'subtitle-pro',
    name: 'Subtitle Pro',
    description: 'Generate subtitles from SRT files with custom animation presets.',
    icon: Type,
    functionName: 'runSubtitlePro'
  },
  {
    id: 'resize-comp',
    name: 'Resize Comp',
    description: 'Crop composition to fit the selected layer exactly.',
    icon: Maximize,
    functionName: 'runResizeComp'
  },
  {
    id: 'unused-cleaner',
    name: 'Unused Cleaner',
    description: 'Detect and remove or move unused footage and pre-comps.',
    icon: Trash2,
    functionName: 'runUnusedCleaner'
  },
  {
    id: 'layer-renamer',
    name: 'Layer Renamer',
    description: 'Batch rename layers with prefixes, suffixes, and numbering.',
    icon: PenTool,
    functionName: 'runRenamer'
  },
  {
    id: 'project-organizer',
    name: 'Organizer',
    description: 'Sort items into a clean folder structure automatically.',
    icon: FolderInput,
    functionName: 'runOrganizer'
  },
  {
    id: 'auto-type-color',
    name: 'Auto Color',
    description: 'Color label layers and add prefixes based on layer type.',
    icon: Palette,
    functionName: 'runAutoColor'
  }
];

const App: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Embed the official vector logo
  const logoSvgContent = projectFiles['logo.svg'] || '';
  const logoBase64 = btoa(unescape(encodeURIComponent(logoSvgContent)));
  const logoSrc = `data:image/svg+xml;base64,${logoBase64}`;

  const handleDownload = async () => {
    try {
        setIsZipping(true);
        const zip = new JSZip();
        
        // Add files from the project map
        Object.entries(projectFiles).forEach(([path, content]) => {
            zip.file(path, content);
        });

        const content = await zip.generateAsync({ type: "blob" });
        
        // Create download link for ZXP
        const url = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = "ToolKit-ByTheGlez.zxp";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Failed to zip", error);
        alert("Failed to generate ZXP");
    } finally {
        setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 bg-glez-dark selection:bg-glez-lime selection:text-black font-sans relative">
      
      {/* Info Modal/Toast */}
      {showInfo && (
        <div className="absolute top-20 right-4 z-50 bg-zinc-800 border border-glez-lime shadow-2xl p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h4 className="text-glez-lime font-bold text-sm uppercase tracking-wider">Plugin By The Glez</h4>
                    <p className="text-white text-xs mt-1 font-mono">Version 1.1</p>
                </div>
                <button onClick={() => setShowInfo(false)} className="text-zinc-500 hover:text-white">
                    <X size={14} />
                </button>
            </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-6 relative flex flex-col items-center justify-center border-b border-white/10 pb-6">
        
        {/* Top Right Utilities (Absolute) */}
        <div className="absolute top-0 right-0 flex gap-2">
            <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-full hover:bg-glez-lime hover:text-black transition-all text-[10px] font-bold uppercase tracking-wider text-zinc-300 border border-zinc-700"
                title="Download ZXP"
            >
                {isZipping ? '...' : 'ZXP'}
                <Download size={12} />
            </button>
            <button 
                onClick={() => setShowInfo(!showInfo)}
                className={`p-1.5 rounded-full transition-colors ${showInfo ? 'bg-glez-lime text-black' : 'bg-zinc-800 text-zinc-400 hover:text-glez-lime'}`}
                title="Info"
            >
                <Info size={16} />
            </button>
        </div>

        {/* Centered Logo (Increased Size) */}
        <div className="h-24 w-full flex justify-center items-center mt-6">
            <img 
                src={logoSrc}
                alt="The Glez" 
                className="h-full w-auto object-contain drop-shadow-[0_0_10px_rgba(204,255,0,0.2)]"
            />
        </div>
        
        <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
            Professional Toolkit
        </div>
      </header>

      {/* Grid - 2 Columns */}
      <main className="flex-1 grid grid-cols-2 gap-3 pb-4 content-start">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => runAeScript(tool.functionName)}
            onMouseEnter={() => setHoveredId(tool.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`
              group relative flex flex-col items-start justify-between 
              p-3 rounded-xl border border-zinc-700/50 
              bg-glez-card transition-all duration-300 ease-out
              hover:border-glez-lime hover:shadow-[0_0_15px_rgba(204,255,0,0.1)]
              hover:-translate-y-1 h-32 overflow-hidden
            `}
          >
            <div className="flex items-start justify-between w-full mb-2">
                <div className={`
                    p-2 rounded-lg bg-zinc-800 transition-colors duration-300
                    group-hover:bg-glez-lime group-hover:text-black
                    text-zinc-300 border border-white/5
                `}>
                    <tool.icon size={20} />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-glez-lime">
                    <Zap size={14} fill="currentColor" />
                </div>
            </div>

            <div className="text-left z-10 w-full">
              <h3 className="text-sm font-bold text-white group-hover:text-glez-lime transition-colors truncate">
                {tool.name}
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1 leading-tight line-clamp-2">
                {tool.description}
              </p>
            </div>
            
            {/* Background Gradient Effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-glez-lime/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        ))}
      </main>

      {/* Footer */}
      <footer className="mt-auto pt-3 border-t border-white/5 text-center">
        <p className="text-[9px] text-zinc-600 uppercase tracking-widest">
            Designed for professional workflows
        </p>
      </footer>
    </div>
  );
};

export default App;