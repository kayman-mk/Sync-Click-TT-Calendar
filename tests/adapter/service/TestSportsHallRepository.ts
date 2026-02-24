import { SportsHallRepository, SportsHallKey } from '../../../src/domain/service/SportsHallRepository';
import { SportsHall } from '../../../src/domain/model/SportsHall';
import { Club } from '../../../src/domain/model/Club';

export class TestSportsHallRepository implements SportsHallRepository {
    async find(key: SportsHallKey, club: Club): Promise<SportsHall | undefined> {
        return undefined;
    }
    async save(sportsHall: SportsHall): Promise<void> {}
    async getAll(): Promise<SportsHall[]> { return []; }
}
