// SportsHall domain model
export interface SportsHall {
    teamName: string; // Used as key for lookup
    sportshallNumber: number; // Used as key for lookup
    postalCode: string;
    city: string;
    street: string;
    houseNumber: string;
    name: string;
}

