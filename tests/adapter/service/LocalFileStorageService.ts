import tmp from 'tmp';
import fs from 'fs';

import {LocalFileStorageService} from "../../../src/adapter/service/LocalFileStorageService"

describe('x', () => {
    it('y', () => {
        tmp.file(function (err, path, fd, cleanupCallback) {
            if (err) throw err;
        
            console.log("File: ", path);
            console.log("Filedescriptor: ", fd);

            fs.writeFileSync(path, "Hello world!")

            let content: string = "";

            new LocalFileStorageService().readFile(path).on('data', (data) => {
                content = content + data;
            })
            .on('end', () => {
                expect(content).toEqual("Hello world!");
            });
        });
    });
});