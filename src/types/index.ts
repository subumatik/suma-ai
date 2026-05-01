export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  analysis?: AnalysisResult;
}

export interface AnalysisResult {
  confidence: number;
  demodexCount: number;
  severity: "none" | "mild" | "moderate" | "severe";
  findings: string[];
  recommendations: string[];
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F";
  lastVisit: string;
  totalAnalyses: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  type: "info" | "warning" | "success" | "error";
}
