import * as fs from "node:fs";
import { injectable } from "inversify";
import { FileStorageService } from "../../domain/service/FileStorageService";

@injectable()
export class LocalFileStorageServiceImpl implements FileStorageService {
    async readFile(filename: string): Promise<string> {
        return fs.promises.readFile(filename, {encoding: 'utf-8'});
    }

    async writeFile(filename: string, content: string): Promise<void> {
        await fs.promises.writeFile(filename, content, { encoding: 'utf-8' });
    }

    async deleteFile(filename: string): Promise<void> {
        await fs.promises.unlink(filename);
    }
}
