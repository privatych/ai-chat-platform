import { PDFParse } from 'pdf-parse';

export async function extractTextFromFile(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop();

  switch (ext) {
    case 'pdf':
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return result.text;

    case 'txt':
    case 'md':
      return buffer.toString('utf-8');

    case 'json':
      try {
        const json = JSON.parse(buffer.toString('utf-8'));
        return JSON.stringify(json, null, 2);
      } catch (error) {
        throw new Error('Invalid JSON file');
      }

    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

export function truncateText(text: string, maxChars: number = 50000): string {
  if (text.length <= maxChars) {
    return text;
  }
  return text.slice(0, maxChars) + '\n\n[Text truncated...]';
}

export function formatProjectContext(sections: {
  files?: Array<{ name: string; content: string }>;
  instructions?: string;
  conversationHistory?: string;
}): string {
  const parts: string[] = [];

  if (sections.files && sections.files.length > 0) {
    parts.push('=== PROJECT FILES ===\n');
    for (const file of sections.files) {
      parts.push(`--- ${file.name} ---\n${file.content}\n`);
    }
  }

  if (sections.instructions) {
    parts.push('=== INSTRUCTIONS ===\n');
    parts.push(sections.instructions + '\n');
  }

  if (sections.conversationHistory) {
    parts.push('=== CONVERSATION HISTORY ===\n');
    parts.push(sections.conversationHistory + '\n');
  }

  return parts.join('\n');
}
