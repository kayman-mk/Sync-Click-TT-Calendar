import { SportsHall } from "../model/SportsHall";

/**
 * Service to fetch sports halls from a remote URL.
 */
export interface SportsHallRemoteService {
    /**
     * Fetch all sports halls for a team from the given URL.
     * @param url The URL to fetch sports halls from
     * @returns Array of SportsHall objects
     */
    fetchSportsHalls(url: string): Promise<SportsHall[]>;
}

