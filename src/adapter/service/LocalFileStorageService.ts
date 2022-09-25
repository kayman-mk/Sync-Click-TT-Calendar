import { createReadStream, ReadStream } from "fs";
import { injectable } from "inversify";
import stream, { Stream } from "stream";
import { FileStorageService } from "../../domain/service/FileStorageService";

@injectable()
export class LocalFileStorageService implements FileStorageService {
    readFile(filename: string): stream.Readable {
        return createReadStream(`${filename}`);
    }
}