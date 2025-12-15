import React, { useState } from 'react';
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
  Download
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

  // Extract embedded logo for preview
  const logoSvg = projectFiles['logo.svg'];
  const logoSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg || '')}`;

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
    <div className="min-h-screen flex flex-col p-4 bg-glez-dark selection:bg-glez-lime selection:text-black">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="h-12 w-auto max-w-[150px]">
                <img 
                    src={logoSrc}
                    alt="The Glez" 
                    className="h-full w-auto object-contain object-left"
                />
            </div>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-full hover:bg-glez-lime hover:text-black transition-all text-xs font-bold uppercase tracking-wider text-zinc-300 border border-zinc-700"
                title="Download Ready-to-Install Plugin"
            >
                {isZipping ? 'Generating...' : 'Download Plugin (ZXP)'}
                <Download size={14} />
            </button>
            <button 
                onClick={() => openUrl('https://theglez.com')}
                className="p-2 rounded-full hover:bg-white/5 transition-colors text-zinc-500 hover:text-glez-lime"
                title="About"
            >
                <Info size={20} />
            </button>
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 grid grid-cols-2 gap-4 pb-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => runAeScript(tool.functionName)}
            onMouseEnter={() => setHoveredId(tool.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`
              group relative flex flex-col items-start justify-between 
              p-4 rounded-xl border border-zinc-700/50 
              bg-glez-card transition-all duration-300 ease-out
              hover:border-glez-lime hover:shadow-[0_0_20px_rgba(204,255,0,0.15)]
              hover:-translate-y-1
            `}
          >
            <div className="flex items-start justify-between w-full mb-3">
                <div className={`
                    p-3 rounded-lg bg-zinc-800 transition-colors duration-300
                    group-hover:bg-glez-lime group-hover:text-black
                    text-zinc-300
                `}>
                    <tool.icon size={24} />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-glez-lime">
                    <Zap size={16} fill="currentColor" />
                </div>
            </div>

            <div className="text-left z-10">
              <h3 className="text-lg font-bold text-white group-hover:text-glez-lime transition-colors">
                {tool.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {tool.description}
              </p>
            </div>
            
            {/* Background Gradient Effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-glez-lime/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        ))}
      </main>

      {/* Footer */}
      <footer className="mt-auto pt-4 border-t border-white/5 text-center">
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
            Designed for professional workflows
        </p>
      </footer>
    </div>
  );
};

export default App;