export interface Frame {
  dataUrl: string;
  timestamp: number;
}

export interface Event {
  type: string;
  ts: number;
  [key: string]: unknown;
}

export interface Comment {
  persona: string;
  text: string;
}
