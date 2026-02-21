import { SportsHall } from "../model/SportsHall";
import {Club} from "../model/Club";

export interface SportsHallRepository {
    /**
     * Finds a sports hall by team name and sportshall number.
     * @param club The club
     * @param sportshallNumber The number of the sportshall
     * @returns The SportsHall if found, otherwise undefined
     */
    findByClubAndSportshall(club: Club, sportshallNumber: number): Promise<SportsHall | undefined>;

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
