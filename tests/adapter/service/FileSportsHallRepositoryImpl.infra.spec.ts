import { FileSportsHallRepositoryImpl } from '../../../src/adapter/service/FileSportsHallRepositoryImpl';
import { LocalFileStorageServiceImpl } from '../../../src/adapter/service/LocalFileStorageServiceImpl';
import { HttpSportsHallRemoteService } from '../../../src/adapter/service/HttpSportsHallRemoteService';
import { SportsHall } from '../../../src/domain/model/SportsHall';
import { Club } from '../../../src/domain/model/Club';
import { Logger } from '../../../src/domain/service/Logger';
import { MockLogger } from '../../test-utils/MockLogger';
import * as fs from 'fs';
import * as path from 'path';

describe('FileSportsHallRepositoryImpl', () => {
    let repo: FileSportsHallRepositoryImpl;
    let storageService: LocalFileStorageServiceImpl;
    let remoteService: HttpSportsHallRemoteService;
    let infraLogger: Logger;

    const testDataDir = path.join(__dirname, '../../../target/test-data');
    const testFilePath = path.join(testDataDir, 'sports_halls.json');

    const sampleData: SportsHall[] = [
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
        {
            club: 'SC Kleckersdorf II',
            sportshallNumber: 1,
            postalCode: '12347',
            city: 'TestCity',
            street: 'TestStreet',
            houseNumber: '3',
            name: 'Hall 3',
        },
    ];

    beforeAll(() => {
        // Create test directory if it doesn't exist
        if (!fs.existsSync(testDataDir)) {
            fs.mkdirSync(testDataDir, { recursive: true });
        }

        // Create test file with sample data
        fs.writeFileSync(testFilePath, JSON.stringify(sampleData, null, 2));

        // Create storage service
        storageService = new LocalFileStorageServiceImpl();

        // Create mock remote service
        remoteService = {
            fetchSportsHalls: jest.fn(),
        } as unknown as HttpSportsHallRemoteService;

        // Create logger
        infraLogger = new MockLogger();
    });

    beforeEach(() => {
        repo = new FileSportsHallRepositoryImpl(testFilePath, storageService, remoteService, infraLogger);
    });

    afterAll(() => {
        // Clean up test files
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    it('should_retrieve_and_find_sports_hall_from_file', async () => {
        // Find the sports hall
        const club: Club = { name: 'SC Kleckersdorf I', url: 'http://localhost/fake.url' };
        const result = await repo.find({ club: club.name, sportshallNumber: 1 }, club);

        // Verify result
        expect(result).toBeDefined();
        expect(result?.name).toBe('Hall 1');
        expect(result?.sportshallNumber).toBe(1);
        expect(result?.postalCode).toBe('12345');
        expect(result?.city).toBe('TestCity');
        expect(result?.street).toBe('TestStreet');
        expect(result?.houseNumber).toBe('1');
        expect(result?.club).toBe('SC Kleckersdorf I');
    });

    it('should_find_second_hall_of_same_club', async () => {
        // Find the second sports hall of the same club
        const club: Club = { name: 'SC Kleckersdorf I', url: 'http://localhost/fake.url' };
        const result = await repo.find({ club: club.name, sportshallNumber: 2 }, club);

        // Verify result
        expect(result).toBeDefined();
        expect(result?.name).toBe('Hall 2');
        expect(result?.sportshallNumber).toBe(2);
        expect(result?.postalCode).toBe('12346');
    });

    it('should_find_hall_from_different_club', async () => {
        // Find the sports hall from a different club
        const club: Club = { name: 'SC Kleckersdorf II', url: 'http://localhost/fake.url' };
        const result = await repo.find({ club: club.name, sportshallNumber: 1 }, club);

        // Verify result
        expect(result).toBeDefined();
        expect(result?.name).toBe('Hall 3');
        expect(result?.club).toBe('SC Kleckersdorf II');
        expect(result?.postalCode).toBe('12347');
    });

    it('should_return_undefined_when_hall_not_found', async () => {
        // Try to find a non-existent hall
        const club: Club = { name: 'SC Kleckersdorf I', url: 'http://localhost/fake.url' };
        const result = await repo.find({ club: club.name, sportshallNumber: 999 }, club);

        // Verify result is undefined
        expect(result).toBeUndefined();
    });
});
