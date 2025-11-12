import { PDFParse } from 'pdf-parse';

/**
 * Extract text content from PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  let parser: PDFParse | null = null;
  try {
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF file');
  } finally {
    // Always destroy parser to free memory
    if (parser) {
      await parser.destroy();
    }
  }
}

/**
 * Validate PDF file
 */
export function validatePDF(buffer: Buffer): boolean {
  // Check PDF magic number (starts with %PDF)
  const header = buffer.toString('utf8', 0, 4);
  return header === '%PDF';
}

/**
 * Extract PDF from Hono request body (multipart/form-data)
 */
export async function extractPDFFromRequest(body: any): Promise<string | null> {
  try {
    if (!body.cv) {
      return null;
    }

    // body.cv is a File object from multipart form
    const file = body.cv;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate PDF
    if (!validatePDF(buffer)) {
      throw new Error('Invalid PDF file');
    }

    // Extract text
    const text = await extractTextFromPDF(buffer);
    return text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw error;
  }
}
