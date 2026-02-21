import { SportsHallRepository } from '../../../src/domain/service/SportsHallRepository';
import { SportsHall } from '../../../src/domain/model/SportsHall';
import {Club} from "../../../src/domain/model/Club";

export class TestSportsHallRepository implements SportsHallRepository {
    async findByClubAndSportshall(club: Club, sportshallNumber: number): Promise<SportsHall | undefined> {
        return undefined;
    }
    async findOrFetchSportsHall(club: Club, sportshallNumber: number): Promise<SportsHall | undefined> {
        return undefined;
    }
    async save(sportsHall: SportsHall): Promise<void> {}
    async getAll(): Promise<SportsHall[]> { return []; }
}

