export type ChatMsg =
  | { role: 'system' | 'user' | 'assistant' | 'tool'; content: string }
  | {
      role: 'user';
      content: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
    };

const API_BASE = 'https://api.mistral.ai/v1';

async function request(path: string, body: unknown, stream = false) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`Mistral API error ${res.status}`);
  }
  return stream ? res.body : res.json();
}

export async function chat(opts: {
  model: string;
  messages: ChatMsg[];
  tools?: any[];
  tool_choice?: 'auto' | { type: 'function'; function: { name: string } };
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' } | undefined;
  stream?: boolean;
}): Promise<ReadableStream | { text: string; tool_calls?: any[] }> {
  const body = {
    model: opts.model,
    messages: opts.messages,
    tools: opts.tools,
    tool_choice: opts.tool_choice,
    temperature: opts.temperature,
    max_tokens: opts.max_tokens,
    response_format: opts.response_format,
    stream: opts.stream
  };
  const res = await request('/chat/completions', body, !!opts.stream);
  if (opts.stream) {
    return res as ReadableStream;
  }
  const choice = (res as any).choices[0];
  return {
    text: choice.message?.content || '',
    tool_calls: choice.message?.tool_calls
  };
}

export async function vision(opts: {
  model: string;
  prompt: string;
  imageBase64s: string[];
  max_tokens?: number;
  response_format?: { type: 'json_object' } | undefined;
}): Promise<{ text: string; json?: any }> {
  const content = [
    { type: 'text', text: opts.prompt },
    ...opts.imageBase64s.map((b64) => ({
      type: 'image_url',
      image_url: { url: `data:image/png;base64,${b64}` }
    }))
  ];
  const body = {
    model: opts.model,
    messages: [{ role: 'user', content }],
    max_tokens: opts.max_tokens,
    response_format: opts.response_format
  };
  const res = (await request('/chat/completions', body)) as any;
  const text = res.choices[0].message?.content || '';
  let json;
  if (opts.response_format?.type === 'json_object') {
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
  }
  return { text, json };
}

export async function code(opts: {
  model: string;
  messages: ChatMsg[];
  mode?: 'instruct' | 'fim';
}): Promise<{ text: string }> {
  const path = opts.mode === 'fim' ? '/fim/completions' : '/chat/completions';
  const body = { model: opts.model, messages: opts.messages };
  const res = (await request(path, body)) as any;
  const text = res.choices[0].message?.content || '';
  return { text };
}
