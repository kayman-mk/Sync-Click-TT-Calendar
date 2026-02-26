import { injectable } from "inversify";
import { LoggerImpl } from "../LoggerImpl";

/**
 * Abstract concurrency-safe, cached repository for any entity type.
 * Handles caching, concurrent async reads, and serializes writes.
 *
 * The filePath must be an absolute path to ensure consistent behavior regardless
 * of the current working directory.
 */
@injectable()
export abstract class FileCachedRepository<T> {
    protected cachedEntities: T[] | undefined;
    private cachePromise?: Promise<T[]>;
    private saveQueue: Promise<void> = Promise.resolve();

    constructor(
        protected readonly filePath: string,
        protected readonly fileStorageService: { readFile: (file: string) => Promise<string>; writeFile: (file: string, content: string) => Promise<void> },
        protected readonly logger: LoggerImpl
    ) {}

    /**
     * Must be implemented to compare primary keys of two entities.
     */
    protected abstract isSamePrimaryKey(a: T, b: T): boolean;

    /**
     * Default implementation using JSON. Override if custom serialization is needed.
     */
    protected serialize(entities: T[]): string {
        return JSON.stringify(entities, null, 2);
    }

    /**
     * Default implementation using JSON. Override if custom deserialization is needed.
     */
    protected deserialize(content: string): T[] {
        return JSON.parse(content);
    }

    async getAll(): Promise<T[]> {
        if (this.cachedEntities !== undefined) {
            return this.cachedEntities;
        }
        if (this.cachePromise) {
            return this.cachePromise;
        }
        this.cachePromise = (async () => {
            let entities: T[];
            try {
                const content = await this.fileStorageService.readFile(this.filePath);
                entities = this.deserialize(content);
            } catch (err: any) {
                if (err && (err.code === 'ENOENT' || err.message?.includes('not found'))) {
                    entities = [];
                } else {
                    this.logger.error(`Error reading file ${this.filePath}: ${err}`);
                    throw err;
                }
            }
            this.cachedEntities = entities;
            this.cachePromise = undefined;
            return entities;
        })();
        return this.cachePromise;
    }

    async save(entity: T): Promise<void> {
        this.saveQueue = this.saveQueue.then(async () => {
            try {
                const entities = await this.getAll();
                const idx = entities.findIndex(e => this.isSamePrimaryKey(e, entity));
                if (idx >= 0) {
                    entities[idx] = entity;
                } else {
                    entities.push(entity);
                }
                await this.saveToFile(entities);
            } catch (err) {
                const errorMessage = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
                this.logger.error(
                    `Failed to save entity to ${this.filePath}. Entity: ${JSON.stringify(entity)}. Error: ${errorMessage}`
                );
                // Do not rethrow, so the queue continues
            }
        });
        return this.saveQueue;
    }

    protected async saveToFile(entities: T[]): Promise<void> {
        await this.fileStorageService.writeFile(this.filePath, this.serialize(entities));
        this.cachedEntities = entities;
        this.cachePromise = undefined;
    }
}
