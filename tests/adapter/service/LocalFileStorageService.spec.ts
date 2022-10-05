import tmp from 'tmp-promise';
import fs from 'fs';

import { LocalFileStorageServiceImpl } from "../../../src/adapter/service/LocalFileStorageServiceImpl"

describe('LocalFileStore', () => {
    it('should read file from local disk', () => {
        // given
        const givenContent: string = "Hello world!";
        const givenFile = tmp.fileSync();
        fs.writeFileSync(givenFile.fd, givenContent);

        // when
        const actualContent: string = new LocalFileStorageServiceImpl().readFile(givenFile.name).toString();

        // then
        expect(actualContent).toEqual(givenContent);
    });
});