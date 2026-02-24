import { injectable, inject } from "inversify";
import { SportsHall } from "../../domain/model/SportsHall";
import { SportsHallRepository, SportsHallKey } from "../../domain/service/SportsHallRepository";
import { Club } from "../../domain/model/Club";
import { SERVICE_IDENTIFIER } from "../../dependency_injection";
import { FileStorageService } from "../../domain/service/FileStorageService";
import { SportsHallRemoteService } from "../../domain/service/SportsHallRemoteService";
import { LoggerImpl } from "../LoggerImpl";
import { FileCachedRepository } from "./CachedRepository";

/**
 * File-based implementation of SportsHallRepository.
 * Stores sports halls in a local JSON file.
 */
@injectable()
export class FileSportsHallRepositoryImpl extends FileCachedRepository<SportsHall> implements SportsHallRepository {
    private static isSamePrimaryKeyImpl(a: SportsHallKey, b: SportsHallKey): boolean {
        return a.club === b.club && a.sportshallNumber === b.sportshallNumber;
    }

    constructor(
        @inject(SERVICE_IDENTIFIER.FileStorageService) fileStorageService: FileStorageService,
        @inject(SERVICE_IDENTIFIER.SportsHallRemoteService) private readonly sportsHallRemoteService: SportsHallRemoteService,
        @inject(SERVICE_IDENTIFIER.Logger) logger: LoggerImpl
    ) {
        super("sports_halls.json", fileStorageService, logger);
    }

    protected isSamePrimaryKey(a: SportsHall, b: SportsHall): boolean {
        return FileSportsHallRepositoryImpl.isSamePrimaryKeyImpl(a, b);
    }

    async find(key: SportsHallKey, club: Club): Promise<SportsHall | undefined> {
        const sportsHalls = await this.getAll();
        let hall = sportsHalls.find(hall => FileSportsHallRepositoryImpl.isSamePrimaryKeyImpl(hall, key));
        if (hall) {
            return hall;
        }
        try {
            // Use the provided Club object for remote fetch
            const fetched = await this.sportsHallRemoteService.fetchSportsHalls(club);
            for (const h of fetched) {
                await this.save(h);
            }
            // Use the cached entities instead of reloading from file
            const cached = this.cachedEntities ?? [];
            return cached.find(hall => FileSportsHallRepositoryImpl.isSamePrimaryKeyImpl(hall, key));
        } catch (err) {
            this.logger.error(`Failed to fetch sports halls for team ${key.club}: ${err}`);
            return undefined;
        }
    }
}
