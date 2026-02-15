import axios from "axios";

/**
 * Uploads an image file to the server.
 * Returns the URL of the uploaded image.
 * 
 * @param file The file to upload
 * @returns Promise resolving to the uploaded image URL
 * @throws Error if upload fails
 */
export async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        
        const response = await axios.post<{ url: string; success: boolean; message?: string }>("/api/upload", {
          file: base64Data,
        });

        resolve(response.data.url);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data?.message) {
            reject(new Error(error.response.data.message));
        } else {
            reject(error);
        }
      }
    };
    reader.onerror = (error) => reject(error);
  });
}
