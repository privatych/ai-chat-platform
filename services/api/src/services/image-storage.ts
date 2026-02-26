import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'images');

/**
 * Saves an image from URL or base64 data to local filesystem
 * @param imageData - URL or base64 data URL of the generated image
 * @param userId - ID of the user who generated the image
 * @param messageId - ID of the message associated with the image
 * @returns Local file path of the saved image
 * @throws Error with message 'IMAGE_STORAGE_FAILED' on any error
 */
export async function saveImage(
  imageData: string,
  userId: string,
  messageId: string
): Promise<string> {
  try {
    let imageBuffer: Buffer;

    console.log('[ImageStorage] Saving image, data type:', typeof imageData);
    console.log('[ImageStorage] Data preview:',
      typeof imageData === 'string' ? imageData.substring(0, 100) : JSON.stringify(imageData).substring(0, 200));

    // Handle different data formats
    if (typeof imageData !== 'string') {
      throw new Error(`Invalid image data type: ${typeof imageData}`);
    }

    // Check if it's a base64 data URL (e.g., data:image/png;base64,...)
    if (imageData.startsWith('data:')) {
      // Extract base64 data from data URL
      const base64Data = imageData.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      // Download image from URL
      const response = await axios.get(imageData, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
      });
      imageBuffer = Buffer.from(response.data);
    } else {
      // Assume it's raw base64 data without the data URL prefix
      imageBuffer = Buffer.from(imageData, 'base64');
    }

    // Create user-specific directory
    const userDir = path.join(UPLOAD_DIR, userId);
    await fs.mkdir(userDir, { recursive: true });

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const filename = `${messageId}-${timestamp}.png`;
    const filePath = path.join(userDir, filename);

    // Write image to disk
    await fs.writeFile(filePath, imageBuffer);

    // Return relative path for database storage
    return `/uploads/images/${userId}/${filename}`;
  } catch (error) {
    // Log error for debugging
    console.error('Failed to save image:', error);
    throw new Error('IMAGE_STORAGE_FAILED');
  }
}

/**
 * Deletes an image from local filesystem
 * Handles missing files gracefully (no error thrown)
 * @param imagePath - Path to the image file (relative or absolute)
 */
export async function deleteImage(imagePath: string): Promise<void> {
  try {
    // Convert relative path to absolute path
    const absolutePath = imagePath.startsWith('/')
      ? path.join(process.cwd(), imagePath)
      : imagePath;

    await fs.unlink(absolutePath);
  } catch (error: any) {
    // If file doesn't exist, that's fine - it's already deleted
    if (error.code === 'ENOENT') {
      console.log('Image file not found, already deleted:', imagePath);
      return;
    }

    // Log other errors but don't throw - we don't want to fail operations
    // just because image cleanup failed
    console.error('Failed to delete image (non-critical):', error);
  }
}
