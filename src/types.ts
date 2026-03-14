export type Language = 'English' | 'Hindi' | 'Gujarati';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface StudyContent {
  answer: string;
  explanation: string;
  keyNotes: string[];
  summary: string[];
  imagePrompt?: string;
  chartData?: ChartDataPoint[];
  chartTitle?: string;
}

export interface AppState {
  input: string;
  image: string | null;
  language: Language;
  loading: boolean;
  result: StudyContent | null;
  generatedImage: string | null;
  error: string | null;
}
