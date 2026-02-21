import { SportsHall } from "../model/SportsHall";
import {Club} from "../model/Club";

/**
 * Service to fetch sports halls from a remote URL.
 */
export interface SportsHallRemoteService {
    /**
     * Fetch all sports halls for a club.
     * @returns Array of SportsHall objects
     */
    fetchSportsHalls(club: Club): Promise<SportsHall[]>;
}

