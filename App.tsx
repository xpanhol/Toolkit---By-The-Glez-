import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  Type, Maximize, Trash2, FolderInput, Palette, PenTool,
  Zap, Info, Download, ArrowLeft, FileVideo, Settings
} from 'lucide-react';
import { ScriptTool } from './types';
import { runAeScript, openUrl } from './services/aeService';
import { projectFiles } from './utils/projectData';

// --- Types ---
type ViewState = 'home' | 'subtitle-pro' | 'unused-cleaner' | 'layer-renamer' | 'project-organizer' | 'auto-color';

// --- Shared UI Components ---
const Button = ({ onClick, children, variant = 'primary', className = '' }: any) => {
    const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm";
    const styles = {
        primary: "bg-glez-lime text-black hover:bg-glez-limeHover",
        secondary: "bg-zinc-700 text-zinc-200 hover:bg-zinc-600",
        danger: "bg-red-900/50 text-red-200 hover:bg-red-900 border border-red-800",
        ghost: "hover:bg-white/10 text-zinc-400 hover:text-white"
    };
    return <button onClick={onClick} className={`${base} ${styles[variant]} ${className}`}>{children}</button>;
};

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:border-glez-lime focus:outline-none transition-colors" />
);

const Label = ({ children }: any) => (
    <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">{children}</label>
);

const Checkbox = ({ label, checked, onChange }: any) => (
    <label className="flex items-center gap-2 cursor-pointer group">
        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-glez-lime border-glez-lime' : 'border-zinc-600 group-hover:border-zinc-400'}`}>
            {checked && <div className="w-2 h-2 bg-black rounded-[1px]" />}
        </div>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="hidden" />
        <span className="text-sm text-zinc-300 group-hover:text-white select-none">{label}</span>
    </label>
);

// --- TOOL VIEWS ---

const SubtitleProView = ({ onBack }: {onBack: () => void}) => {
    const [srtName, setSrtName] = useState<string>('');
    const [srtContent, setSrtContent] = useState<string>('');
    const [config, setConfig] = useState({
        size: 30,
        break: 50,
        color: '#FFFFFF',
        caps: false,
        stroke: false,
        y: 92,
        anim: 'Pop Up'
    });

    const handleImport = async () => {
        try {
            const res = await runAeScript('getSrtFileContent');
            if (res) {
                const data = JSON.parse(res);
                setSrtName(data.name);
                setSrtContent(data.content);
            }
        } catch (e) { alert("Error importing SRT"); }
    };

    const handleRun = () => {
        // Convert hex to [0-1, 0-1, 0-1] for AE
        const r = parseInt(config.color.slice(1,3), 16) / 255;
        const g = parseInt(config.color.slice(3,5), 16) / 255;
        const b = parseInt(config.color.slice(5,7), 16) / 255;

        runAeScript('runSubtitleProLogic', {
            srtContent,
            config: {
                ...config,
                wrap: config.break, // mapping UI 'break' to logic 'wrap'
                color: [r, g, b]
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
                <Label>Source File</Label>
                <div className="flex gap-2 mt-2">
                    <Button variant="secondary" onClick={handleImport} className="shrink-0"><FileVideo size={16}/> Load .SRT</Button>
                    <div className="flex-1 bg-zinc-900 border border-zinc-700 rounded flex items-center px-3 text-xs text-zinc-400 truncate">
                        {srtName || "No file selected..."}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Font Size (px)</Label>
                    <Input type="number" value={config.size} onChange={e => setConfig({...config, size: parseInt(e.target.value)})} />
                </div>
                <div>
                    <Label>Line Break (chars)</Label>
                    <Input type="number" value={config.break} onChange={e => setConfig({...config, break: parseInt(e.target.value)})} />
                </div>
            </div>

            <div>
                <Label>Text Color</Label>
                <div className="flex gap-2 mt-1">
                    <input type="color" value={config.color} onChange={e => setConfig({...config, color: e.target.value})} className="h-9 w-12 bg-transparent cursor-pointer rounded overflow-hidden" />
                    <Input value={config.color} onChange={e => setConfig({...config, color: e.target.value})} />
                </div>
            </div>

            <div className="flex gap-6">
                <Checkbox label="UPPERCASE" checked={config.caps} onChange={(v:boolean) => setConfig({...config, caps: v})} />
                <Checkbox label="Add Stroke" checked={config.stroke} onChange={(v:boolean) => setConfig({...config, stroke: v})} />
            </div>

            <div>
                 <Label>Animation Preset</Label>
                 <select 
                    value={config.anim} 
                    onChange={e => setConfig({...config, anim: e.target.value})}
                    className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:border-glez-lime outline-none"
                 >
                    <option>Pop Up</option>
                    <option>Fade In</option>
                    <option>Slide Up</option>
                    <option>Typewriter</option>
                 </select>
            </div>

            <div>
                <Label>Vertical Position (Y%)</Label>
                <input 
                    type="range" min="0" max="100" value={config.y} 
                    onChange={e => setConfig({...config, y: parseInt(e.target.value)})} 
                    className="w-full accent-glez-lime mt-2 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-right text-xs text-zinc-500 mt-1">{config.y}%</div>
            </div>

            <Button onClick={handleRun} className="w-full py-3 text-base">Generate Subtitles</Button>
        </div>
    );
};

const RenamerView = () => {
    const [params, setParams] = useState({ prefix: '', base: '', suffix: '', numbering: true });
    
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="grid grid-cols-1 gap-4">
                <div><Label>Prefix</Label><Input value={params.prefix} onChange={e => setParams({...params, prefix: e.target.value})} placeholder="e.g. SC01_" /></div>
                <div><Label>Base Name</Label><Input value={params.base} onChange={e => setParams({...params, base: e.target.value})} placeholder="New Name" /></div>
                <div><Label>Suffix</Label><Input value={params.suffix} onChange={e => setParams({...params, suffix: e.target.value})} placeholder="e.g. _v01" /></div>
             </div>
             <div className="pt-2">
                 <Checkbox label="Add Numbering (01, 02...)" checked={params.numbering} onChange={(v:boolean) => setParams({...params, numbering: v})} />
             </div>
             <Button onClick={() => runAeScript('runRenamerLogic', params)} className="w-full mt-4">Rename Selected Layers</Button>
        </div>
    );
};

const UnusedCleanerView = () => {
    const [opts, setOpts] = useState({ precomps: true, footage: true, method: 'move' }); // method: move | delete

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 space-y-3">
                <Label>What to clean?</Label>
                <Checkbox label="Unused Pre-comps" checked={opts.precomps} onChange={(v:boolean) => setOpts({...opts, precomps: v})} />
                <Checkbox label="Unused Footage" checked={opts.footage} onChange={(v:boolean) => setOpts({...opts, footage: v})} />
            </div>

            <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
                <Label>Action</Label>
                <div className="space-y-3 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="method" checked={opts.method === 'move'} onChange={() => setOpts({...opts, method: 'move'})} className="accent-glez-lime" />
                        <span className="text-sm text-zinc-300">Move to "_Unused" Folder</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="method" checked={opts.method === 'delete'} onChange={() => setOpts({...opts, method: 'delete'})} className="accent-red-500" />
                        <span className="text-sm text-zinc-300">Delete Permanently</span>
                    </label>
                </div>
            </div>

            <Button 
                variant={opts.method === 'delete' ? 'danger' : 'primary'} 
                onClick={async () => {
                    const msg = await runAeScript('runUnusedCleanerLogic', opts);
                    alert(msg);
                }} 
                className="w-full"
            >
                {opts.method === 'move' ? 'Move Items' : 'Delete Items'}
            </Button>
        </div>
    );
};

const OrganizerView = () => {
    const [comps, setComps] = useState<{id: number, name: string}[]>([]);
    const [state, setState] = useState({
        preset: 0, // 0 basic, 1 adv
        keepFolders: true,
        useMaster: false,
        masterCompId: 0
    });

    useEffect(() => {
        runAeScript('getProjectComps').then(res => {
            try { setComps(JSON.parse(res)); } catch(e){}
        });
    }, []);

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <Label>Structure Preset</Label>
                <div className="flex gap-2 mt-1 bg-zinc-900 p-1 rounded-lg border border-zinc-700">
                    <button onClick={() => setState({...state, preset: 0})} className={`flex-1 py-1.5 text-xs rounded transition-colors ${state.preset === 0 ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>Basic</button>
                    <button onClick={() => setState({...state, preset: 1})} className={`flex-1 py-1.5 text-xs rounded transition-colors ${state.preset === 1 ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>Advanced</button>
                </div>
            </div>

            <div className="space-y-3">
                <Checkbox label="Ignore items already in folders" checked={state.keepFolders} onChange={(v:boolean) => setState({...state, keepFolders: v})} />
                <Checkbox label="Isolate Master Comp (Output)" checked={state.useMaster} onChange={(v:boolean) => setState({...state, useMaster: v})} />
            </div>

            {state.useMaster && (
                <div className="animate-in fade-in duration-200">
                    <Label>Select Master Comp</Label>
                    <select 
                        className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:border-glez-lime outline-none"
                        onChange={e => setState({...state, masterCompId: parseInt(e.target.value)})}
                    >
                        <option value={0}>-- Select --</option>
                        {comps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            )}

            <Button onClick={() => runAeScript('runOrganizerLogic', state)} className="w-full mt-4">Organize Project</Button>
        </div>
    );
};

const AutoColorView = () => {
    const [addPrefix, setAddPrefix] = useState(true);
    // AE Label Colors map
    const labels = [
        {val: 0, name: 'None', color: 'transparent'},
        {val: 1, name: 'Red', color: '#FF0000'},
        {val: 2, name: 'Yellow', color: '#FFFF00'},
        {val: 3, name: 'Aqua', color: '#00FFFF'},
        {val: 4, name: 'Pink', color: '#FF00FF'},
        {val: 5, name: 'Lavender', color: '#E6E6FA'},
        {val: 6, name: 'Peach', color: '#FFDAB9'},
        {val: 7, name: 'Seafoam', color: '#20B2AA'},
        {val: 8, name: 'Blue', color: '#0000FF'},
        {val: 9, name: 'Green', color: '#008000'},
        {val: 10, name: 'Purple', color: '#800080'},
        {val: 11, name: 'Orange', color: '#FFA500'},
        {val: 12, name: 'Brown', color: '#A52A2A'},
        {val: 13, name: 'Fuchsia', color: '#FF00FF'},
        {val: 14, name: 'Cyan', color: '#00FFFF'},
        {val: 15, name: 'Sand', color: '#F4A460'},
        {val: 16, name: 'Smoke', color: '#F5F5F5'},
    ];

    const [typeLabels, setTypeLabels] = useState({
        camera: 4, light: 6, audio: 7, precomp: 15,
        footVideo: 3, footStill: 5, text: 1, shape: 8,
        null: 1, adjust: 5, other: 2
    });

    const LabelRow = ({label, id}: any) => (
        <div className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
            <span className="text-sm text-zinc-300 w-1/3">{label}</span>
            <select 
                value={typeLabels[id as keyof typeof typeLabels]} 
                onChange={(e) => setTypeLabels({...typeLabels, [id]: parseInt(e.target.value)})}
                className="w-2/3 bg-zinc-900 border border-zinc-700 rounded p-1 text-xs text-zinc-300 outline-none focus:border-glez-lime"
            >
                {labels.map(l => <option key={l.val} value={l.val}>{l.name}</option>)}
            </select>
        </div>
    );

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 px-4 py-2 h-64 overflow-y-auto custom-scrollbar">
                <LabelRow label="Camera" id="camera" />
                <LabelRow label="Light" id="light" />
                <LabelRow label="Audio" id="audio" />
                <LabelRow label="Null" id="null" />
                <LabelRow label="Text" id="text" />
                <LabelRow label="Shape" id="shape" />
                <LabelRow label="Adjustment" id="adjust" />
                <LabelRow label="Pre-comp" id="precomp" />
                <LabelRow label="Video" id="footVideo" />
                <LabelRow label="Image" id="footStill" />
                <LabelRow label="Other" id="other" />
             </div>

             <div className="bg-zinc-800/50 p-3 rounded-lg">
                <Checkbox label="Add prefix (e.g. CAM-, VID-)" checked={addPrefix} onChange={setAddPrefix} />
             </div>

             <Button onClick={() => runAeScript('runAutoColorLogic', {labels: typeLabels, addPrefix})} className="w-full">
                Apply to Selection
             </Button>
        </div>
    );
};

// --- MAIN APP ---

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  // Logo setup
  const logoSvg = projectFiles['logo.svg'];
  const logoSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg || '')}`;

  const handleDownload = async () => {
    try {
        setIsZipping(true);
        const zip = new JSZip();
        Object.entries(projectFiles).forEach(([path, content]) => {
            zip.file(path, content);
        });
        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = "ToolKit-ByTheGlez.zxp";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error(error);
        alert("Failed to generate ZXP");
    } finally {
        setIsZipping(false);
    }
  };

  const toolDef = [
      { id: 'subtitle-pro', name: 'Subtitle Pro', desc: 'Gen subs from SRT', icon: Type, view: 'subtitle-pro' },
      { id: 'resize-comp', name: 'Resize Comp', desc: 'Crop comp to layer', icon: Maximize, action: () => runAeScript('runResizeComp') },
      { id: 'unused-cleaner', name: 'Clean Unused', desc: 'Remove unused items', icon: Trash2, view: 'unused-cleaner' },
      { id: 'layer-renamer', name: 'Renamer', desc: 'Batch rename layers', icon: PenTool, view: 'layer-renamer' },
      { id: 'project-organizer', name: 'Organizer', desc: 'Sort folder structure', icon: FolderInput, view: 'project-organizer' },
      { id: 'auto-type-color', name: 'Auto Color', desc: 'Label & Prefix', icon: Palette, view: 'auto-color' },
  ];

  const goHome = () => setView('home');

  return (
    <div className="min-h-screen flex flex-col p-4 bg-glez-dark selection:bg-glez-lime selection:text-black font-sans">
      
      {/* Header */}
      <header className="mb-6 relative h-32 flex items-center justify-center border-b border-white/10 shrink-0">
        
        {/* Left: Back Button */}
        <div className="absolute left-0 flex items-center">
            {view !== 'home' && (
                <button onClick={goHome} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <div className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700"><ArrowLeft size={18} /></div>
                    <span className="font-bold text-lg text-white">{toolDef.find(t => t.view === view)?.name}</span>
                </button>
            )}
        </div>

        {/* Center: Logo (Only on Home) */}
        {view === 'home' && (
            <div className="h-32 w-auto transition-transform duration-300 hover:scale-105">
                <img src={logoSrc} alt="The Glez" className="h-full w-auto object-contain" />
            </div>
        )}
        
        {/* Right: Actions (Only on Home) */}
        {view === 'home' && (
            <div className="absolute right-0 flex items-center gap-3">
                <div className="hidden sm:block text-[10px] font-mono uppercase tracking-widest text-zinc-500 text-right leading-tight">
                    Plugin By<br/>- The Glez V1.1
                </div>
                <div className="p-2 rounded-full text-zinc-500">
                    <Info size={20} />
                </div>
                <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-full hover:bg-glez-lime hover:text-black transition-all text-[10px] font-bold uppercase tracking-wider text-zinc-300 border border-zinc-700"
                >
                    {isZipping ? '...' : 'Get ZXP'} <Download size={12} />
                </button>
            </div>
        )}
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {view === 'home' ? (
            <div className="grid grid-cols-2 gap-3 pb-4">
                {toolDef.map((tool: any) => (
                    <button
                        key={tool.id}
                        onClick={() => tool.view ? setView(tool.view) : tool.action()}
                        onMouseEnter={() => setHoveredId(tool.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className={`
                        group relative flex flex-col items-start justify-between 
                        p-4 rounded-xl border border-zinc-700/50 
                        bg-glez-card transition-all duration-300 ease-out
                        hover:border-glez-lime hover:shadow-[0_0_20px_rgba(204,255,0,0.1)]
                        hover:-translate-y-1 h-[110px]
                        `}
                    >
                        <div className="flex items-start justify-between w-full mb-1">
                            <div className="p-2 rounded-lg bg-zinc-800 transition-colors duration-300 group-hover:bg-glez-lime group-hover:text-black text-zinc-300">
                                <tool.icon size={20} />
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-glez-lime">
                                <Zap size={14} fill="currentColor" />
                            </div>
                        </div>
                        <div className="text-left z-10">
                            <h3 className="text-sm font-bold text-white group-hover:text-glez-lime transition-colors">{tool.name}</h3>
                            <p className="text-[10px] text-zinc-400 leading-tight">{tool.desc}</p>
                        </div>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-glez-lime/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </button>
                ))}
            </div>
        ) : (
            <div className="pb-4">
                {view === 'subtitle-pro' && <SubtitleProView onBack={goHome} />}
                {view === 'layer-renamer' && <RenamerView />}
                {view === 'unused-cleaner' && <UnusedCleanerView />}
                {view === 'project-organizer' && <OrganizerView />}
                {view === 'auto-color' && <AutoColorView />}
            </div>
        )}
      </main>

      <footer className="mt-auto pt-4 border-t border-white/5 text-center">
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Designed for professional workflows</p>
      </footer>
    </div>
  );
};

export default App;