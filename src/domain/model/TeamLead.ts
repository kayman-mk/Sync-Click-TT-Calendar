/**
 * TeamLead domain model
 * Represents a team lead with their full name, associated team, age class, and competition round
 */
export class TeamLead {
    /**
     * The full name of the team lead
     */
    fullName: string;

    /**
     * The name of the team this lead is responsible for
     */
    teamName: string;

    /**
     * The age class (e.g., "Herren", "Damen", "Jugend", "mJ12", "wJ12")
     */
    ageClass: string;

    /**
     * The competition round (e.g., "VR" for Vorrunde, "RR" for Rückrunde)
     */
    runde: string;

    /**
     * The email address of the team lead
     */
    email: string;

    constructor(fullName: string, teamName: string, ageClass: string = "", runde: string = "", email: string = "") {
        this.fullName = fullName;
        this.teamName = teamName;
        this.ageClass = ageClass;
        this.runde = runde;
        this.email = email;
    }
}

