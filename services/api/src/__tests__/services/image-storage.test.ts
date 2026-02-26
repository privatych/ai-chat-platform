import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveImage, deleteImage } from '../../services/image-storage';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

vi.mock('axios');
vi.mock('fs/promises');

const mockedAxios = axios as any;
const mockedFs = fs as any;

describe('Image Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('saveImage', () => {
    it('should download and save image successfully', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      const tempUrl = 'https://temp-url.com/image.png';
      const userId = 'user123';
      const messageId = 'msg456';

      // Mock axios.get to return image data
      mockedAxios.get.mockResolvedValue({
        data: mockImageBuffer,
      });

      // Mock fs.mkdir to succeed
      mockedFs.mkdir.mockResolvedValue(undefined);

      // Mock fs.writeFile to succeed
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await saveImage(tempUrl, userId, messageId);

      // Verify result format
      expect(result).toMatch(/^\/uploads\/images\/user123\/msg456-\d+\.png$/);

      // Verify axios was called correctly
      expect(mockedAxios.get).toHaveBeenCalledWith(tempUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      // Verify directory was created
      expect(mockedFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('/uploads/images/user123'),
        { recursive: true }
      );

      // Verify file was written
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.png'),
        mockImageBuffer
      );
    });

    it('should throw IMAGE_STORAGE_FAILED on download error', async () => {
      const tempUrl = 'https://temp-url.com/image.png';
      const userId = 'user123';
      const messageId = 'msg456';

      // Mock axios to throw error
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(saveImage(tempUrl, userId, messageId)).rejects.toThrow(
        'IMAGE_STORAGE_FAILED'
      );
    });

    it('should throw IMAGE_STORAGE_FAILED on write error', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      const tempUrl = 'https://temp-url.com/image.png';
      const userId = 'user123';
      const messageId = 'msg456';

      // Mock axios to succeed
      mockedAxios.get.mockResolvedValue({
        data: mockImageBuffer,
      });

      // Mock mkdir to succeed
      mockedFs.mkdir.mockResolvedValue(undefined);

      // Mock writeFile to fail
      mockedFs.writeFile.mockRejectedValue(new Error('Disk full'));

      await expect(saveImage(tempUrl, userId, messageId)).rejects.toThrow(
        'IMAGE_STORAGE_FAILED'
      );
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      const imagePath = '/uploads/images/user123/msg456-1234567890.png';

      // Mock fs.unlink to succeed
      mockedFs.unlink.mockResolvedValue(undefined);

      await expect(deleteImage(imagePath)).resolves.toBeUndefined();

      // Verify unlink was called
      expect(mockedFs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('msg456-1234567890.png')
      );
    });

    it('should handle missing file gracefully', async () => {
      const imagePath = '/uploads/images/user123/missing.png';

      // Mock fs.unlink to throw ENOENT error
      const error: any = new Error('ENOENT: no such file or directory');
      error.code = 'ENOENT';
      mockedFs.unlink.mockRejectedValue(error);

      // Should not throw - just log and continue
      await expect(deleteImage(imagePath)).resolves.toBeUndefined();
    });

    it('should handle other deletion errors gracefully', async () => {
      const imagePath = '/uploads/images/user123/locked.png';

      // Mock fs.unlink to throw permission error
      const error: any = new Error('EPERM: operation not permitted');
      error.code = 'EPERM';
      mockedFs.unlink.mockRejectedValue(error);

      // Should not throw - just log and continue
      await expect(deleteImage(imagePath)).resolves.toBeUndefined();
    });
  });
});
