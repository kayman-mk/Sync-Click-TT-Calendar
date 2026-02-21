// Team domain model
// Represents a team and the URL to fetch its sports halls
export interface Team {
    /**
     * The name of the team (unique identifier)
     */
    name: string;

    /**
     * URL to retrieve the sports halls for this team
     */
    sportsHallsUrl: string;
}

