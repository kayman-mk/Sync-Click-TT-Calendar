import { SportsHallRepository } from '../../../src/domain/service/SportsHallRepository';
import { Team } from '../../../src/domain/model/Team';
import { SportsHall } from '../../../src/domain/model/SportsHall';

export class TestSportsHallRepository implements SportsHallRepository {
    async findByTeamAndSportshall(teamName: string, sportshallNumber: number): Promise<SportsHall | undefined> {
        return undefined;
    }
    async findOrFetchSportsHall(team: Team, sportshallNumber: number): Promise<SportsHall | undefined> {
        return undefined;
    }
    async save(sportsHall: SportsHall): Promise<void> {}
    async getAll(): Promise<SportsHall[]> { return []; }
}

