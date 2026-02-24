import { TeamLead } from "../model/TeamLead";

export interface TeamLeadRepository {

    /**
     * Finds a team lead by team name, age class, and round.
     * @param teamName The name of the team
     * @param ageClass The age class
     * @param runde The competition round (e.g., "VR" or "RR")
     * @returns The TeamLead if found, otherwise undefined
     */
    findByTeamNameAndAgeClass(teamName: string, ageClass: string, runde: string): Promise<TeamLead | undefined>;

    /**
     * Finds a team lead by their full name and round.
     * @param fullName The full name of the team lead
     * @param runde The competition round (e.g., "VR" or "RR")
     * @returns The TeamLead if found, otherwise undefined
     */
    findByName(fullName: string, runde: string): Promise<TeamLead | undefined>;

    /**
     * Loads all team leads for a specific round from storage.
     * @param runde The competition round (e.g., "VR" or "RR")
     * @returns Array of team leads for the specified round
     */
    getAll(runde: string): Promise<TeamLead[]>;
}

