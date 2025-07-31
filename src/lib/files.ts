import { FileSource } from "./types/TranscribeFileRequest";

export function prepareFileForFormData(file: FileSource): { file: FileSource; options?: { filename: string; contentType: string } } {
  // For Buffer objects, detect file type and provide metadata
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer?.(file)) {
    const { filename, contentType } = detectAudioFileType(file);
    return {
      file,
      options: { filename, contentType }
    };
  }
  
  // For other file types (File, Blob, ReadStream), return as-is
  return { file };
}

function detectAudioFileType(buffer: Buffer): { filename: string; contentType: string } {
  let filename = "audio";
  let contentType = "application/octet-stream";
  
  if (buffer.length >= 4) {
    const header = buffer.subarray(0, 12);
    
    // WAV file signature
    if (header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WAVE') {
      filename = "audio.wav";
      contentType = "audio/wav";
    }
    // MP3 file signature
    else if (header.subarray(0, 2).toString('hex') === 'fffa' || header.subarray(0, 2).toString('hex') === 'fffb' || 
             header.subarray(0, 3).toString() === 'ID3') {
      filename = "audio.mp3";
      contentType = "audio/mpeg";
    }
    // M4A/AAC file signature
    else if (header.subarray(4, 8).toString() === 'ftyp') {
      filename = "audio.m4a";
      contentType = "audio/mp4";
    }
    // OGG file signature
    else if (header.subarray(0, 4).toString() === 'OggS') {
      filename = "audio.ogg";
      contentType = "audio/ogg";
    }
    // FLAC file signature
    else if (header.subarray(0, 4).toString() === 'fLaC') {
      filename = "audio.flac";
      contentType = "audio/flac";
    }
  }
  
  return { filename, contentType };
}