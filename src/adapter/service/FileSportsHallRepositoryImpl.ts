import { injectable, inject } from "inversify";
import { SportsHall } from "../../domain/model/SportsHall";
import { SportsHallRepository } from "../../domain/service/SportsHallRepository";
import { SERVICE_IDENTIFIER } from "../../dependency_injection";
import { FileStorageService } from "../../domain/service/FileStorageService";
import { SportsHallRemoteService } from "../../domain/service/SportsHallRemoteService";
import {Club} from "../../domain/model/Club";

/**
 * File-based implementation of SportsHallRepository.
 * Stores sports halls in a local JSON file.
 */
@injectable()
export class FileSportsHallRepositoryImpl implements SportsHallRepository {
    private readonly fileName = "sports_halls.json";

    constructor(
        @inject(SERVICE_IDENTIFIER.FileStorageService) private readonly fileStorageService: FileStorageService,
        @inject(SERVICE_IDENTIFIER.SportsHallRemoteService) private readonly sportsHallRemoteService: SportsHallRemoteService
    ) {}

    async findByClubAndSportshall(club: Club, sportshallNumber: number): Promise<SportsHall | undefined> {
        const sportsHalls = await this.getAll();

        let hall = sportsHalls.find(hall => hall.club === club.name && hall.sportshallNumber === sportshallNumber);
        if (hall) {
            return hall;
        }

        try {
            const fetched = await this.sportsHallRemoteService.fetchSportsHalls(club);
            for (const h of fetched) {
                await this.save(h);
            }

            // Reload from storage to ensure up-to-date
            const updatedHalls = await this.getAll();
            return updatedHalls.find(hall => hall.club === club.name && hall.sportshallNumber === sportshallNumber);
        } catch (err) {
            // Log and return undefined
            console.error(`Failed to fetch sports halls for team ${club.name}:`, err);
            return undefined;
        }
    }

    async save(sportsHall: SportsHall): Promise<void> {
        const sportsHalls = await this.getAll();
        const idx = sportsHalls.findIndex(hall => hall.club === sportsHall.club && hall.sportshallNumber === sportsHall.sportshallNumber);
        if (idx >= 0) {
            sportsHalls[idx] = sportsHall;
        } else {
            sportsHalls.push(sportsHall);
        }
        await this.saveAll(sportsHalls);
    }

    async getAll(): Promise<SportsHall[]> {
        try {
            const content = await this.fileStorageService.readFile(this.fileName);
            // FileStorageService.readFile returns a string
            return JSON.parse(content);
        } catch (err: any) {
            if (err && (err.code === 'ENOENT' || err.message?.includes('not found'))) {
                return [];
            }
            console.error('Error reading sports halls file:', err);
            throw err;
        }
    }

    private async saveAll(sportsHalls: SportsHall[]): Promise<void> {
        await this.fileStorageService.writeFile(this.fileName, JSON.stringify(sportsHalls, null, 2));
    }
}
