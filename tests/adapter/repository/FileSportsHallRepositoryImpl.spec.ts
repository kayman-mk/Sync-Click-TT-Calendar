import { FileSportsHallRepositoryImpl } from '../../../src/adapter/repository/FileSportsHallRepositoryImpl';
import { FileStorageService } from '../../../src/domain/service/FileStorageService';
import { SportsHallRemoteService } from '../../../src/domain/service/SportsHallRemoteService';
import { SportsHall } from '../../../src/domain/model/SportsHall';
import { Club } from "../../../src/domain/model/Club";
import { MockLogger } from '../../test-utils/MockLogger';

// Mocks
const mockFileStorageService: FileStorageService = {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    deleteFile: jest.fn(),
};
const mockRemoteService: SportsHallRemoteService = {
    fetchSportsHalls: jest.fn(),
};
const mockLogger = new MockLogger();

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
            '/test/path/sports_halls.json',
            mockFileStorageService,
            mockRemoteService,
            mockLogger
        );
    });

    it('should return hall if found locally', async () => {
        (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(JSON.stringify([hall]));
        const result = await repo.find({ club: club.name, sportshallNumber: 1 }, club);
        expect(result).toEqual(hall);
    });

    it('should return undefined if remote fetch fails', async () => {
        (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(JSON.stringify([]));
        (mockRemoteService.fetchSportsHalls as jest.Mock).mockRejectedValue(new Error('fail'));
        const result = await repo.find({ club: club.name, sportshallNumber: 1 }, club);
        expect(result).toBeUndefined();
    });

    describe('find', () => {
        it('should_return_sports_hall_when_found_by_club_and_number', async () => {
            const sampleData = [
                {
                    club: 'SC Kleckersdorf I',
                    sportshallNumber: 1,
                    postalCode: '12345',
                    city: 'TestCity',
                    street: 'TestStreet',
                    houseNumber: '1',
                    name: 'Hall 1',
                },
                {
                    club: 'SC Kleckersdorf I',
                    sportshallNumber: 2,
                    postalCode: '12346',
                    city: 'TestCity',
                    street: 'TestStreet',
                    houseNumber: '2',
                    name: 'Hall 2',
                },
            ];
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(JSON.stringify(sampleData));

            const testClub: Club = { name: 'SC Kleckersdorf I', url: 'http://localhost/fake.url' };
            const result = await repo.find({ club: testClub.name, sportshallNumber: 2 }, testClub);

            expect(result).toBeDefined();
            expect(result?.name).toBe('Hall 2');
            expect(result?.sportshallNumber).toBe(2);
        });

        it('should_return_undefined_when_sports_hall_not_found', async () => {
            const sampleData = [
                {
                    club: 'SC Kleckersdorf I',
                    sportshallNumber: 1,
                    postalCode: '12345',
                    city: 'TestCity',
                    street: 'TestStreet',
                    houseNumber: '1',
                    name: 'Hall 1',
                },
            ];
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(JSON.stringify(sampleData));

            const testClub: Club = { name: 'SC Kleckersdorf I', url: 'http://localhost/fake.url' };
            const result = await repo.find({ club: testClub.name, sportshallNumber: 999 }, testClub);

            expect(result).toBeUndefined();
        });

        it('should_return_undefined_when_file_not_found', async () => {
            (mockFileStorageService.readFile as jest.Mock).mockRejectedValue({
                code: 'ENOENT',
            });

            const testClub: Club = { name: 'SC Kleckersdorf I', url: 'http://localhost/fake.url' };
            const result = await repo.find({ club: testClub.name, sportshallNumber: 1 }, testClub);

            expect(result).toBeUndefined();
        });

        it('should_handle_multiple_halls_per_club', async () => {
            const sampleData = [
                {
                    club: 'SC Kleckersdorf I',
                    sportshallNumber: 1,
                    postalCode: '12345',
                    city: 'TestCity',
                    street: 'TestStreet 1',
                    houseNumber: '1',
                    name: 'Hall 1',
                },
                {
                    club: 'SC Kleckersdorf I',
                    sportshallNumber: 2,
                    postalCode: '12346',
                    city: 'TestCity',
                    street: 'TestStreet 2',
                    houseNumber: '2',
                    name: 'Hall 2',
                },
                {
                    club: 'SC Kleckersdorf I',
                    sportshallNumber: 3,
                    postalCode: '12347',
                    city: 'TestCity',
                    street: 'TestStreet 3',
                    houseNumber: '3',
                    name: 'Hall 3',
                },
            ];
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(JSON.stringify(sampleData));

            const testClub: Club = { name: 'SC Kleckersdorf I', url: 'http://localhost/fake.url' };
            const result1 = await repo.find({ club: testClub.name, sportshallNumber: 1 }, testClub);
            const result2 = await repo.find({ club: testClub.name, sportshallNumber: 2 }, testClub);
            const result3 = await repo.find({ club: testClub.name, sportshallNumber: 3 }, testClub);

            expect(result1?.name).toBe('Hall 1');
            expect(result2?.name).toBe('Hall 2');
            expect(result3?.name).toBe('Hall 3');
        });

        it('should_correctly_parse_sports_hall_properties', async () => {
            const sampleData = [
                {
                    club: 'SC Kleckersdorf I',
                    sportshallNumber: 1,
                    postalCode: '98765',
                    city: 'Munich',
                    street: 'Main Street',
                    houseNumber: '42',
                    name: 'Olympic Hall',
                },
            ];
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(JSON.stringify(sampleData));

            const testClub: Club = { name: 'SC Kleckersdorf I', url: 'http://localhost/fake.url' };
            const result = await repo.find({ club: testClub.name, sportshallNumber: 1 }, testClub);

            expect(result).toBeDefined();
            expect(result?.postalCode).toBe('98765');
            expect(result?.city).toBe('Munich');
            expect(result?.street).toBe('Main Street');
            expect(result?.houseNumber).toBe('42');
            expect(result?.name).toBe('Olympic Hall');
        });

        it('should_convert_plain_objects_to_sports_hall_instances', async () => {
            const sampleData = [
                {
                    club: 'SC Kleckersdorf I',
                    sportshallNumber: 1,
                    postalCode: '12345',
                    city: 'TestCity',
                    street: 'TestStreet',
                    houseNumber: '1',
                    name: 'Hall 1',
                },
                {
                    club: 'SC Kleckersdorf II',
                    sportshallNumber: 2,
                    postalCode: '12346',
                    city: 'TestCity',
                    street: 'TestStreet',
                    houseNumber: '2',
                    name: 'Hall 2',
                },
            ];
            (mockFileStorageService.readFile as jest.Mock).mockResolvedValue(JSON.stringify(sampleData));

            const testClub: Club = { name: 'SC Kleckersdorf I', url: 'http://localhost/fake.url' };
            const result = await repo.find({ club: testClub.name, sportshallNumber: 1 }, testClub);

            expect(result).toBeDefined();
            expect(result?.name).toBe('Hall 1');
            expect(result?.sportshallNumber).toBe(1);
        });
    });
});
