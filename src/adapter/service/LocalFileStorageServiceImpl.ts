import * as fs from "fs";
import { injectable } from "inversify";
import { FileStorageService } from "../../domain/service/FileStorageService";

@injectable()
export class LocalFileStorageServiceImpl implements FileStorageService {
    readFile(filename: string): Buffer {
        return Buffer.from(fs.readFileSync(`${filename}`, {encoding: 'latin1'}));
    }

    writeFile(filename: string, content: string): void {
        fs.writeFileSync(filename, content, { encoding: 'latin1' });
    }
}
