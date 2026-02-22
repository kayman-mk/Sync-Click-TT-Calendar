import { TeamLead } from "../model/TeamLead";

export interface TeamLeadRepository {
    /**
     * Finds a team lead by team name.
     * @param teamName The name of the team
     * @returns The TeamLead if found, otherwise undefined
     */
    findByTeamName(teamName: string): Promise<TeamLead | undefined>;

    /**
     * Finds a team lead by their full name.
     * @param name The first name of the team lead
     * @param surname The surname of the team lead
     * @returns The TeamLead if found, otherwise undefined
     */
    findByName(name: string, surname: string): Promise<TeamLead | undefined>;

    /**
     * Loads all team leads from storage.
     * @returns Array of all team leads
     */
    getAll(): Promise<TeamLead[]>;
}

