import supabase from './supabaseClient';

export interface SignedUploadResponse {
  signedUrl: string;
  fileUrl: string;
}

/**
 * Request a pre-signed upload URL from your Supabase Edge function
 * @param fileName The name of the file to upload (e.g. "avatar.png")
 * @param fileType The MIME type of the file (e.g. "image/png")
 * @returns An object containing the signed URL for uploading and the final file URL
 */
export async function getSignedUploadUrl(
  fileName: string,
  fileType: string
): Promise<SignedUploadResponse | null> {
  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(import.meta.env.VITE_GET_S3_SIGNED_URL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fileName, fileType }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to get signed upload URL');
    }

    const data = await res.json();
    return data as SignedUploadResponse;
  } catch (error) {
    console.error('Error fetching signed upload URL:', error);
    return null;
  }
}

/**
 * Upload a file directly to S3 using the signed URL
 * @param signedUrl The pre-signed URL for uploading
 * @param file The File or Blob to upload
 * @returns true if upload succeeded, false otherwise
 */
export async function uploadFileToS3(signedUrl: string, file: File | Blob): Promise<boolean> {
    try {
      const res = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('S3 upload failed:', res.status, res.statusText, text);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      return false;
    }
  }
  