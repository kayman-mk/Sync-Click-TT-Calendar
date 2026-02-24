import { SportsHall } from "../model/SportsHall";
import { Club } from "../model/Club";

export interface SportsHallKey {
    club: string;
    sportshallNumber: number;
}

export interface SportsHallRepository {
    /**
     * Finds a sports hall by primary key and club.
     * @param key The primary key (club, sportshallNumber)
     * @param club The club object (for remote fetch)
     * @returns The SportsHall if found, otherwise undefined
     */
    find(key: SportsHallKey, club: Club): Promise<SportsHall | undefined>;

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
