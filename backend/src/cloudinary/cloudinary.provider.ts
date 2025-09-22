import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export const CLOUDINARY = 'Cloudinary';

export const CloudinaryProvider: Provider = {
  provide: CLOUDINARY,
  useFactory: (configService: ConfigService) => {
    const cloudinaryUrl = configService.get<string>('CLOUDINARY_URL');
    if (!cloudinaryUrl) {
      throw new Error('CLOUDINARY_URL is not configured in environment variables');
    }
    return cloudinary.config({
        // The URL is automatically parsed by the SDK
        cloudinary_url: cloudinaryUrl,
    });
  },
  inject: [ConfigService],
};
