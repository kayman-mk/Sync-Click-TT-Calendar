import tmp from 'tmp-promise';
import fs from 'fs';
import path from 'path';
import { LocalFileStorageServiceImpl } from "../../../src/adapter/service/LocalFileStorageServiceImpl"

describe('LocalFileStorageServiceImpl', () => {
    let service: LocalFileStorageServiceImpl;
    beforeEach(() => {
        service = new LocalFileStorageServiceImpl();
    });
    describe('readFile', () => {
        it('should read file from local disk', async () => {
            // given
            const givenContent: string = "Hello world!";
            const givenFile = tmp.fileSync();
            fs.writeFileSync(givenFile.fd, givenContent);
            // when
            const actualContent: string = await service.readFile(givenFile.name);
            // then
            expect(actualContent).toEqual(givenContent);
        });
        it('should read file with multiple lines', async () => {
            // given
            const givenContent: string = "Line 1\nLine 2\nLine 3";
            const givenFile = tmp.fileSync();
            fs.writeFileSync(givenFile.fd, givenContent);
            // when
            const actualContent: string = await service.readFile(givenFile.name);
            // then
            expect(actualContent).toEqual(givenContent);
        });
        it('should read file with special characters', async () => {
            // given
            const givenContent: string = "Special chars: äöü, @#$%, 你好";
            const givenFile = tmp.fileSync();
            fs.writeFileSync(givenFile.fd, givenContent, {encoding: 'utf-8'});
            // when
            const actualContent: string = await service.readFile(givenFile.name);
            // then
            expect(actualContent).toEqual(givenContent);
        });
        it('should read empty file', async () => {
            // given
            const givenFile = tmp.fileSync();
            fs.writeFileSync(givenFile.fd, "");
            // when
            const actualContent: string = await service.readFile(givenFile.name);
            // then
            expect(actualContent).toEqual("");
        });
        it('should throw error when file does not exist', async () => {
            // given
            const nonExistentFile = "/tmp/non-existent-file-12345.txt";
            // when & then
            await expect(service.readFile(nonExistentFile)).rejects.toThrow();
        });
    });
    describe('writeFile', () => {
        it('should write content to a new file', async () => {
            // given
            const tmpDir = await tmp.dir();
            const filename = path.join(tmpDir.path, "test-file.txt");
            const givenContent = "Test content";
            try {
                // when
                await service.writeFile(filename, givenContent);
                // then
                const actualContent = fs.readFileSync(filename, {encoding: 'utf-8'});
                expect(actualContent).toEqual(givenContent);
            } finally {
                // cleanup
                fs.unlinkSync(filename);
                await tmpDir.cleanup();
            }
        });
        it('should overwrite existing file', async () => {
            // given
            const givenFile = tmp.fileSync();
            fs.writeFileSync(givenFile.fd, "Original content");
            const newContent = "New content";
            // when
            await service.writeFile(givenFile.name, newContent);
            // then
            const actualContent = fs.readFileSync(givenFile.name, {encoding: 'utf-8'});
            expect(actualContent).toEqual(newContent);
        });
        it('should write empty string to file', async () => {
            // given
            const tmpDir = await tmp.dir();
            const filename = path.join(tmpDir.path, "empty-test.txt");
            try {
                // when
                await service.writeFile(filename, "");
                // then
                const actualContent = fs.readFileSync(filename, {encoding: 'utf-8'});
                expect(actualContent).toEqual("");
            } finally {
                // cleanup
                fs.unlinkSync(filename);
                await tmpDir.cleanup();
            }
        });
        it('should write file with multiple lines', async () => {
            // given
            const tmpDir = await tmp.dir();
            const filename = path.join(tmpDir.path, "multiline.txt");
            const givenContent = "Line 1\nLine 2\nLine 3";
            try {
                // when
                await service.writeFile(filename, givenContent);
                // then
                const actualContent = fs.readFileSync(filename, {encoding: 'utf-8'});
                expect(actualContent).toEqual(givenContent);
            } finally {
                // cleanup
                fs.unlinkSync(filename);
                await tmpDir.cleanup();
            }
        });
        it('should write file with special characters', async () => {
            // given
            const tmpDir = await tmp.dir();
            const filename = path.join(tmpDir.path, "special-chars.txt");
            const givenContent = "Special: äöü, @#$%, JSON: {\"key\": \"value\"}";
            try {
                // when
                await service.writeFile(filename, givenContent);
                // then
                const actualContent = fs.readFileSync(filename, {encoding: 'utf-8'});
                expect(actualContent).toEqual(givenContent);
            } finally {
                // cleanup
                fs.unlinkSync(filename);
                await tmpDir.cleanup();
            }
        });
        it('should throw error when directory does not exist', async () => {
            // given
            const nonExistentPath = "/tmp/non-existent-dir-12345/file.txt";
            // when & then
            await expect(service.writeFile(nonExistentPath, "content")).rejects.toThrow();
        });
    });
    describe('deleteFile', () => {
        it('should delete an existing file', async () => {
            // given
            const givenFile = tmp.fileSync();
            fs.writeFileSync(givenFile.fd, "content to delete");
            // when
            await service.deleteFile(givenFile.name);
            // then
            expect(fs.existsSync(givenFile.name)).toBeFalsy();
        });
        it('should delete file that was just written', async () => {
            // given
            const tmpDir = await tmp.dir();
            const filename = path.join(tmpDir.path, "to-delete.txt");
            await service.writeFile(filename, "content");
            try {
                // when
                await service.deleteFile(filename);
                // then
                expect(fs.existsSync(filename)).toBeFalsy();
            } finally {
                // cleanup
                await tmpDir.cleanup();
            }
        });
        it('should throw error when file does not exist', async () => {
            // given
            const nonExistentFile = "/tmp/non-existent-file-to-delete-12345.txt";
            // when & then
            await expect(service.deleteFile(nonExistentFile)).rejects.toThrow();
        });
    });
    describe('integration scenarios', () => {
        it('should write, read, and delete a file successfully', async () => {
            // given
            const tmpDir = await tmp.dir();
            const filename = path.join(tmpDir.path, "integration-test.txt");
            const givenContent = "Integration test content";
            try {
                // when
                await service.writeFile(filename, givenContent);
                const readContent = await service.readFile(filename);
                await service.deleteFile(filename);
                // then
                expect(readContent).toEqual(givenContent);
                expect(fs.existsSync(filename)).toBeFalsy();
            } finally {
                // cleanup
                await tmpDir.cleanup();
            }
        });
        it('should handle multiple sequential operations', async () => {
            // given
            const tmpDir = await tmp.dir();
            const filename = path.join(tmpDir.path, "sequential-test.txt");
            try {
                // when
                await service.writeFile(filename, "Content 1");
                let content = await service.readFile(filename);
                expect(content).toEqual("Content 1");
                await service.writeFile(filename, "Content 2");
                content = await service.readFile(filename);
                expect(content).toEqual("Content 2");
                await service.deleteFile(filename);
                // then
                expect(fs.existsSync(filename)).toBeFalsy();
            } finally {
                // cleanup
                await tmpDir.cleanup();
            }
        });
    });
});
