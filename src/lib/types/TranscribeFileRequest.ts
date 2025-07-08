import fs from "fs";

export type FileSource = File | fs.ReadStream | Blob | Buffer


export interface TranscribeFileRequest {
  file: FileSource;
  language?: string;
  keywords?: Record<string, string>;
}