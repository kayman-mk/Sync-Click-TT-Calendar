// Team domain model
// Represents a team and the URL to fetch its sports halls
export interface Club {
    /**
     * The name of the club (unique identifier)
     */
    name: string;

    /**
     * URL to retrieve the sports halls for this club
     */
    url: string;
}

