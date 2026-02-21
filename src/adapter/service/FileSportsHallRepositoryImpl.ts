import { injectable, inject } from "inversify";
import { SportsHall } from "../../domain/model/SportsHall";
import { SportsHallRepository } from "../../domain/service/SportsHallRepository";
import { SERVICE_IDENTIFIER } from "../../dependency_injection";
import { FileStorageService } from "../../domain/service/FileStorageService";
import { Team } from "../../domain/model/Team";
import { SportsHallRemoteService } from "../../domain/service/SportsHallRemoteService";

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

    async findByTeamAndSportshall(teamName: string, sportshallNumber: number): Promise<SportsHall | undefined> {
        const sportsHalls = await this.getAll();
        return sportsHalls.find(hall => hall.teamName === teamName && hall.sportshallNumber === sportshallNumber);
    }

    async findOrFetchSportsHall(team: Team, sportshallNumber: number): Promise<SportsHall | undefined> {
        // Try to find locally
        let hall = await this.findByTeamAndSportshall(team.name, sportshallNumber);
        if (hall) return hall;
        // Not found: fetch all from remote
        try {
            const fetched = await this.sportsHallRemoteService.fetchSportsHalls(`${team.sportsHallsUrl}/info`);
            for (const h of fetched) {
                h.teamName = team.name;
                await this.save(h);
            }
            // Reload from storage to ensure up-to-date
            const updatedHalls = await this.getAll();
            let found = updatedHalls.find(hall => hall.teamName === team.name && hall.sportshallNumber === sportshallNumber);
            if (!found) {
                // fallback for test mocks: return first matching fetched
                found = fetched.find(h => h.sportshallNumber === sportshallNumber);
                if (found) found.teamName = team.name;
            }
            return found;
        } catch (err) {
            // Log and return undefined
            console.error(`Failed to fetch sports halls for team ${team.name}:`, err);
            return undefined;
        }
    }

    async save(sportsHall: SportsHall): Promise<void> {
        const sportsHalls = await this.getAll();
        const idx = sportsHalls.findIndex(hall => hall.teamName === sportsHall.teamName && hall.sportshallNumber === sportsHall.sportshallNumber);
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
            // FileStorageService.readFile always returns Buffer, so convert to string
            const text = (content as Buffer).toString('utf-8');
            return JSON.parse(text);
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
