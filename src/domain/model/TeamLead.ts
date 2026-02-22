/**
 * TeamLead domain model
 * Represents a team lead with their name, surname, and associated team
 */
export class TeamLead {
    /**
     * The first name of the team lead
     */
    name: string;

    /**
     * The surname/last name of the team lead
     */
    surname: string;

    /**
     * The name of the team this lead is responsible for
     */
    teamName: string;

    constructor(name: string, surname: string, teamName: string) {
        this.name = name;
        this.surname = surname;
        this.teamName = teamName;
    }

    /**
     * Returns the full name of the team lead
     */
    getFullName(): string {
        return `${this.name} ${this.surname}`;
    }
}

