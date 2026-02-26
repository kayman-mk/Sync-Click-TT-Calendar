import { FileTeamLeadRepositoryImpl } from '../../../src/adapter/service/FileTeamLeadRepositoryImpl';
import { LocalFileStorageServiceImpl } from '../../../src/adapter/service/LocalFileStorageServiceImpl';
import { Logger } from '../../../src/domain/service/Logger';
import { MockLogger } from '../../test-utils/MockLogger';
import * as fs from 'fs';
import * as path from 'path';

describe('FileTeamLeadRepositoryImpl', () => {
    let repo: FileTeamLeadRepositoryImpl;
    let storageService: LocalFileStorageServiceImpl;
    let infraLogger: Logger;

    const testDataDir = path.join(__dirname, '../../../target/test-data');
    const testFilePath = path.join(testDataDir, 'team_leads.json');

    const sampleData = {
        VR: [
            {
                fullName: 'John Smith',
                teamName: 'SC Kleckersdorf I',
                ageClass: 'Herren',
                email: 'john.smith@example.com',
            },
            {
                fullName: 'Maria Mueller',
                teamName: 'SC Kleckersdorf II',
                ageClass: 'Damen',
                email: 'maria.mueller@example.com',
            },
        ],
        RR: [
            {
                fullName: 'John Smith',
                teamName: 'SC Kleckersdorf I',
                ageClass: 'Herren',
                email: 'john.smith@example.com',
            },
        ],
    };

    beforeAll(() => {
        // Create test directory if it doesn't exist
        if (!fs.existsSync(testDataDir)) {
            fs.mkdirSync(testDataDir, { recursive: true });
        }

        // Create test file with sample data (runde-keyed structure)
        fs.writeFileSync(testFilePath, JSON.stringify(sampleData, null, 2));

        // Create storage service
        storageService = new LocalFileStorageServiceImpl();

        // Create logger
        infraLogger = new MockLogger();
    });

    beforeEach(() => {
        repo = new FileTeamLeadRepositoryImpl(testFilePath, storageService, infraLogger);
    });

    afterAll(() => {
        // Clean up test files
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    it('should_retrieve_and_find_team_lead_from_file', async () => {
        // Find the team lead
        const result = await repo.findByTeamNameAndAgeClass('SC Kleckersdorf I', 'Herren', 'VR');

        // Verify result
        expect(result).toBeDefined();
        expect(result?.fullName).toBe('John Smith');
        expect(result?.teamName).toBe('SC Kleckersdorf I');
        expect(result?.ageClass).toBe('Herren');
        expect(result?.runde).toBe('VR');
        expect(result?.email).toBe('john.smith@example.com');
    });

    it('should_find_team_lead_by_name_and_runde', async () => {
        // Find the team lead by name
        const result = await repo.findByName('Maria Mueller', 'VR');

        // Verify result
        expect(result).toBeDefined();
        expect(result?.fullName).toBe('Maria Mueller');
        expect(result?.teamName).toBe('SC Kleckersdorf II');
        expect(result?.ageClass).toBe('Damen');
        expect(result?.runde).toBe('VR');
        expect(result?.email).toBe('maria.mueller@example.com');
    });

    it('should_get_all_team_leads_by_runde', async () => {
        // Get all team leads for VR
        const result = await repo.getAllByRunde('VR');

        // Verify results
        expect(result).toHaveLength(2);
        expect(result[0].fullName).toBe('John Smith');
        expect(result[1].fullName).toBe('Maria Mueller');
        expect(result.every(lead => lead.runde === 'VR')).toBe(true);
    });

    it('should_find_same_person_in_different_runde', async () => {
        // Find John Smith in both VR and RR
        const vrResult = await repo.findByName('John Smith', 'VR');
        const rrResult = await repo.findByName('John Smith', 'RR');

        // Verify both exist but in different rundes
        expect(vrResult).toBeDefined();
        expect(rrResult).toBeDefined();
        expect(vrResult?.runde).toBe('VR');
        expect(rrResult?.runde).toBe('RR');
        expect(vrResult?.fullName).toBe(rrResult?.fullName);
    });
});
