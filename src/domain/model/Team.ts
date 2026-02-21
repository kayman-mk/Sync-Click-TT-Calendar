// Team domain model
// Represents a team and the URL to fetch its sports halls
export class Team {
    /**
     * The name of the team (unique identifier)
     */
    name: string;

    /**
     * URL to retrieve the sports halls for this team
     */
    url: string;

    constructor(name: string, url: string) {
        this.name = name;
        this.url = url;
    }

    /**
     * Returns the name of the club
     */
    getClubName(): string {
        // remove roman numerals from the end of the name
        this.name = this.name.replace(/\s*V?X?I{0,3}V?X?$/, "").trim();

        // remove (wJxx) suffixes
        this.name = this.name.replace(/\s*\(wJ\d+\)$/, "").trim();

        return this.name;
    }
}
