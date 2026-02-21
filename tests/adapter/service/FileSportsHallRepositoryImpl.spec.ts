import { FileSportsHallRepositoryImpl } from '../../../src/adapter/service/FileSportsHallRepositoryImpl';
import { FileStorageService } from '../../../src/domain/service/FileStorageService';
import { SportsHallRemoteService } from '../../../src/domain/service/SportsHallRemoteService';
import { Team } from '../../../src/domain/model/Team';
import { SportsHall } from '../../../src/domain/model/SportsHall';
import {Club} from "../../../src/domain/model/Club";

// Mocks
const mockFileStorageService: FileStorageService = {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    deleteFile: jest.fn(),
};
const mockRemoteService: SportsHallRemoteService = {
    fetchSportsHalls: jest.fn(),
};

describe('FileSportsHallRepositoryImpl', () => {
    let repo: FileSportsHallRepositoryImpl;
    const club: Club = { name: 'TestTeam', url: 'http://localhost/fake.url' };
    const hall: SportsHall = {
        club: 'TestTeam',
        sportshallNumber: 1,
        postalCode: '12345',
        city: 'TestCity',
        street: 'TestStreet',
        houseNumber: '1',
        name: 'Test Hall',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        repo = new FileSportsHallRepositoryImpl(
            mockFileStorageService,
            mockRemoteService
        );
    });

    it('should return hall if found locally', async () => {
        (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(Buffer.from(JSON.stringify([hall])));
        const result = await repo.findByClubAndSportshall(club, 1);
        expect(result).toEqual(hall);
    });

    it('should return undefined if remote fetch fails', async () => {
        (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(Buffer.from(JSON.stringify([])));
        (mockRemoteService.fetchSportsHalls as jest.Mock).mockRejectedValue(new Error('fail'));
        const result = await repo.findByClubAndSportshall(club, 1);
        expect(result).toBeUndefined();
    });
});
