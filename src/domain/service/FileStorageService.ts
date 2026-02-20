
export interface FileStorageService {
    readFile(filename: string): Buffer;
    writeFile(filename: string, content: string): void;
    deleteFile(filename: string): void;
}
