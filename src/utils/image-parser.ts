import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

/**
 * Extract text from image using Gemini Vision
 */
export async function extractTextFromImage(imageBuffer: Buffer, mimeType: string): Promise<string> {
  try {
    const model = google('gemini-2.5-flash-lite');
    
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const result = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this Instagram bio screenshot. Return ONLY the text content without any additional explanation or formatting. If there are emojis, include them as well.',
            },
            {
              type: 'image',
              image: dataUrl,
            },
          ],
        },
      ],
    });

    return result.text;
  } catch (error) {
    console.error('Image text extraction error:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Extract image from Hono request body (multipart/form-data)
 */
export async function extractImageFromRequest(body: any): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    if (!body.image) {
      return null;
    }

    // body.image is a File object from multipart form
    const file = body.image;
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      buffer,
      mimeType: file.type || 'image/png',
    };
  } catch (error) {
    console.error('Image extraction error:', error);
    throw error;
  }
}
