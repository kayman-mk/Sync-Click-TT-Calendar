import stream from "stream";

export interface FileStorageService {
    readFile(filename: string): Buffer;
}