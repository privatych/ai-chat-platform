// @ts-ignore - pdf-parse has type issues with ESM
import pdfParse from 'pdf-parse';

interface FileObject {
  name: string;
  mimeType: string;
  data: string; // base64
  size?: number;
}

export async function extractTextFromFile(file: FileObject): Promise<string> {
  const ext = file.name.toLowerCase().split('.').pop();
  const buffer = Buffer.from(file.data, 'base64');

  switch (ext) {
    case 'pdf':
      try {
        // @ts-ignore - pdf-parse callable type issue
        const result = await pdfParse(buffer);
        return result.text;
      } catch (error: any) {
        throw new Error(`Failed to parse PDF: ${error.message}`);
      }

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
