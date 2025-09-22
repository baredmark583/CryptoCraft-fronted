// FIX: Import 'multer' to provide type definitions for Express.Multer.File.
import 'multer';
import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import axios from 'axios';
// FIX: Explicitly import Buffer to resolve TypeScript 'Cannot find name' error.
import { Buffer } from 'buffer';

@Injectable()
export class UploadService {
  async uploadFile(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Make sure that the file is uploaded');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto', // Automatically detect image or video
          folder: 'cryptocraft', // Optional: organize uploads in a folder
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve({ url: result.secure_url });
        },
      );

      const readableStream = new Readable();
      readableStream._read = () => {}; // _read is required but can be a no-op
      readableStream.push(file.buffer);
      readableStream.push(null);

      readableStream.pipe(uploadStream);
    });
  }

  async uploadFileFromUrl(imageUrl: string): Promise<{ url: string }> {
    if (!imageUrl) {
      throw new BadRequestException('Image URL is required');
    }

    try {
      // Download image as a buffer
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        },
        timeout: 45000,
      });
      const buffer = Buffer.from(response.data, 'binary');

      // Upload buffer to Cloudinary
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'cryptocraft',
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve({ url: result.secure_url });
          },
        );

        const readableStream = new Readable();
        readableStream._read = () => {};
        readableStream.push(buffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
      });
    } catch (error) {
      console.error(`Failed to download or upload image from URL: ${imageUrl}`, error);
      throw new BadRequestException(`Could not process image from URL. It may be invalid or protected.`);
    }
  }
}
