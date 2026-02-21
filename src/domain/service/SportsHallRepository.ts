import { SportsHall } from "../model/SportsHall";
import { Team } from "../model/Team";

export interface SportsHallRepository {
    /**
     * Finds a sports hall by team name and sportshall number.
     * @param teamName The name of the team
     * @param sportshallNumber The number of the sportshall
     * @returns The SportsHall if found, otherwise undefined
     */
    findByTeamAndSportshall(teamName: string, sportshallNumber: number): Promise<SportsHall | undefined>;

    /**
     * Finds a sports hall for a team, fetching and storing all if not found locally.
     * @param team The team object
     * @param sportshallNumber The number of the sportshall
     * @returns The SportsHall if found, otherwise undefined
     */
    findOrFetchSportsHall(team: Team, sportshallNumber: number): Promise<SportsHall | undefined>;

    /**
     * Saves or updates a sports hall.
     * @param sportsHall The sports hall to save
     */
    save(sportsHall: SportsHall): Promise<void>;

    /**
     * Loads all sports halls from storage.
     * @returns Array of all sports halls
     */
    getAll(): Promise<SportsHall[]>;
}
