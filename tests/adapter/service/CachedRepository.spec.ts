import { FileCachedRepository } from '../../../src/adapter/service/CachedRepository';

// Simple entity for testing
interface TestEntity {
    id: number;
    value: string;
}

// Mock logger
class MockLogger {
    public errors: any[] = [];
    error(message: any) { this.errors.push(message); }
}

// Mock file storage
class MockFileStorage {
    public files: Record<string, string> = {};
    public readCount = 0;
    public writeCount = 0;
    async readFile(file: string) {
        this.readCount++;
        if (!(file in this.files)) {
            const err: any = new Error('not found');
            err.code = 'ENOENT';
            throw err;
        }
        return this.files[file];
    }
    async writeFile(file: string, content: string) {
        this.writeCount++;
        this.files[file] = content;
    }
}

// Concrete test repository
class TestFileCachedRepository extends FileCachedRepository<TestEntity> {
    protected isSamePrimaryKey(a: TestEntity, b: TestEntity): boolean {
        return a.id === b.id;
    }
}

describe('FileCachedRepository', () => {
    let repo: TestFileCachedRepository;
    let storage: MockFileStorage;
    let logger: MockLogger;
    const filePath = '/test/path/test.json';

    beforeEach(() => {
        storage = new MockFileStorage();
        logger = new MockLogger();
        // @ts-ignore: LoggerImpl type
        repo = new TestFileCachedRepository(filePath, storage, logger);
    });

    it('should read from file only once and cache result', async () => {
        storage.files[filePath] = JSON.stringify([{ id: 1, value: 'a' }]);
        const first = await repo.getAll();
        const second = await repo.getAll();
        expect(first).toEqual([{ id: 1, value: 'a' }]);
        expect(second).toBe(first); // same reference
        expect(storage.readCount).toBe(1);
    });

    it('should only read once for concurrent getAll calls', async () => {
        storage.files[filePath] = JSON.stringify([{ id: 2, value: 'b' }]);
        const [a, b] = await Promise.all([repo.getAll(), repo.getAll()]);
        expect(a).toEqual(b);
        expect(storage.readCount).toBe(1);
    });

    it('should serialize and deserialize entities', async () => {
        storage.files[filePath] = JSON.stringify([{ id: 3, value: 'c' }]);
        const all = await repo.getAll();
        expect(all).toEqual([{ id: 3, value: 'c' }]);
        await repo.save({ id: 4, value: 'd' });
        expect(JSON.parse(storage.files[filePath])).toContainEqual({ id: 4, value: 'd' });
    });

    it('should update existing entity by primary key', async () => {
        storage.files[filePath] = JSON.stringify([{ id: 5, value: 'e' }]);
        await repo.getAll();
        await repo.save({ id: 5, value: 'updated' });
        expect(JSON.parse(storage.files[filePath])).toContainEqual({ id: 5, value: 'updated' });
    });

    it('should queue saves and not lose updates', async () => {
        storage.files[filePath] = JSON.stringify([]);
        await repo.getAll();
        await Promise.all([
            repo.save({ id: 6, value: 'x' }),
            repo.save({ id: 7, value: 'y' }),
            repo.save({ id: 6, value: 'z' })
        ]);
        const result = JSON.parse(storage.files[filePath]);
        expect(result).toContainEqual({ id: 6, value: 'z' });
        expect(result).toContainEqual({ id: 7, value: 'y' });
        // Ensure no stale intermediate state remains and only distinct IDs are present
        expect(result).not.toContainEqual({ id: 6, value: 'x' });
        expect(result).toHaveLength(2);
        expect(storage.writeCount).toBe(3); // Each save triggers a write
    });

    it('should handle ENOENT as empty file', async () => {
        const all = await repo.getAll();
        expect(all).toEqual([]);
    });

    it('should log and continue queue on save error', async () => {
        const originalWriteFile = storage.writeFile;
        storage.writeFile = async () => { throw new Error('fail'); };
        await repo.save({ id: 8, value: 'err' });
        // Next save should still work
        storage.writeFile = originalWriteFile;
        await repo.save({ id: 8, value: 'err' });
        // Next save should still work
        storage.writeFile = MockFileStorage.prototype.writeFile;
        await repo.save({ id: 9, value: 'ok' });
        expect(logger.errors.some((msg: string) => msg.includes('Failed to save entity'))).toBe(true);
        expect(JSON.parse(storage.files[filePath])).toContainEqual({ id: 9, value: 'ok' });
    });
});
