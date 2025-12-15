import { LucideIcon } from 'lucide-react';

export interface ScriptTool {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  functionName: string; // The function to call in host/index.jsx
}

declare global {
  interface Window {
    CSInterface: any;
  }
}