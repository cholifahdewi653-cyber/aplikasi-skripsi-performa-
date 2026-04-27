type UploadType = "image";

export interface UploadOptions {
  fileBuffer?: Buffer | null;
  url?: string | null;
  type?: UploadType;
  folder?: string;
}

export interface UploadResult {
  url: string;
  id: string;
}
