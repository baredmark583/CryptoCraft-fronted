// This is a service that interacts with our backend's upload endpoint.
// The backend will then securely handle the upload to Cloudinary.
import { apiService } from './apiService';

export const cloudinaryService = {
  uploadImage: async (file: File): Promise<string> => {
    console.log(`Uploading image to backend: ${file.name}`);
    try {
      const response = await apiService.uploadFile(file);
      return response.url; // The backend returns the secure URL from Cloudinary
    } catch (error) {
      console.error("Image upload failed:", error);
      throw error;
    }
  },
  
  uploadVideo: async (file: File): Promise<string> => {
    console.log(`Uploading video to backend: ${file.name}`);
     try {
      const response = await apiService.uploadFile(file);
      return response.url;
    } catch (error) {
      console.error("Video upload failed:", error);
      throw error;
    }
  },
};
