import fs from "fs";
import { VadConfig } from "./VadConfig";

export type FileSource = File | fs.ReadStream | Blob | Buffer;

export interface TranscribeFileRequest {
  file: FileSource;
  language?: string;
  keywords?: Record<string, string>;
  vadConfig?: VadConfig;
}
