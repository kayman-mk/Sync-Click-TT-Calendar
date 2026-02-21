import { inject, injectable } from "inversify";
import { SportsHall } from "../model/SportsHall";
import { SportsHallRepository } from "./SportsHallRepository";
import { SportsHallRemoteService } from "./SportsHallRemoteService";
import { Team } from "../model/Team";
import { SERVICE_IDENTIFIER } from "../../dependency_injection";

/**
 * Service to find a sports hall for a team, fetching from remote if not found locally.
 */
@injectable()
export class SportsHallService {
    constructor(
        @inject(SERVICE_IDENTIFIER.SportsHallRepository) private readonly sportsHallRepository: SportsHallRepository,
        @inject(SERVICE_IDENTIFIER.SportsHallRemoteService) private readonly sportsHallRemoteService: SportsHallRemoteService
    ) {}

    /**
     * Find a sports hall for a team, fetching and storing all if not found locally.
     * @param team The team object
     * @param sportshallNumber The number of the sportshall
     * @returns The SportsHall if found, otherwise undefined
     */
    async findOrFetchSportsHall(team: Team, sportshallNumber: number): Promise<SportsHall | undefined> {
        // Try to find locally
        let hall = await this.sportsHallRepository.findByTeamAndSportshall(team.name, sportshallNumber);
        if (hall) return hall;
        // Not found: fetch all from remote
        try {
            const fetched = await this.sportsHallRemoteService.fetchSportsHalls(team.sportsHallsUrl);
            for (const h of fetched) {
                // Ensure the teamName is set for local lookup
                h.teamName = team.name;
                await this.sportsHallRepository.save(h);
            }
            // Retry lookup
            return await this.sportsHallRepository.findByTeamAndSportshall(team.name, sportshallNumber);
        } catch (err) {
            // Log and return undefined
            console.error(`Failed to fetch sports halls for team ${team.name}:`, err);
            return undefined;
        }
    }
}
