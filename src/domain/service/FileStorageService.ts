/**
 * Service interface for managing file storage operations.
 * Provides abstraction for reading, writing, and deleting files.
 * Implementations of this interface handle the actual file I/O operations.
 */
export interface FileStorageService {
    /**
     * Reads the content of a file.
     * @param filename The name or path of the file to read.
     * @returns A promise that resolves with the file content as a string.
     * @throws Error if the file cannot be read or does not exist.
     */
    readFile(filename: string): Promise<string>;

    /**
     * Writes content to a file.
     * If the file does not exist, it will be created.
     * If the file exists, its content will be overwritten.
     * @param filename The name or path of the file to write to.
     * @param content The content to write to the file.
     * @returns A promise that resolves when the file has been successfully written.
     * @throws Error if the file cannot be written.
     */
    writeFile(filename: string, content: string): Promise<void>;

    /**
     * Deletes a file.
     * @param filename The name or path of the file to delete.
     * @returns A promise that resolves when the file has been successfully deleted.
     * @throws Error if the file cannot be deleted or does not exist.
     */
    deleteFile(filename: string): Promise<void>;
}
