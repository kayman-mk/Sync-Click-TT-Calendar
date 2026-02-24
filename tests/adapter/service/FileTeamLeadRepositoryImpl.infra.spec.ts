import { FileTeamLeadRepositoryImpl } from '../../../src/adapter/service/FileTeamLeadRepositoryImpl';
import { LocalFileStorageServiceImpl } from '../../../src/adapter/service/LocalFileStorageServiceImpl';
import { TeamLead } from '../../../src/domain/model/TeamLead';
import { TeamLeadRepository } from '../../../src/domain/service/TeamLeadRepository';
import * as fs from 'fs';
import * as path from 'path';

// Custom implementation for testing with a different filename (read-only)
class TestFileTeamLeadRepositoryImpl implements TeamLeadRepository {
    private readonly fileName = 'test_team_leads.json';

    constructor(private readonly fileStorageService: LocalFileStorageServiceImpl) {}


    async findByTeamNameAndAgeClass(teamName: string, ageClass: string, runde: string): Promise<TeamLead | undefined> {
        const teamLeads = await this.getAll(runde);
        return teamLeads.find(lead => lead.teamName === teamName && lead.ageClass === ageClass);
    }

    async findByName(fullName: string, runde: string): Promise<TeamLead | undefined> {
        const teamLeads = await this.getAll(runde);
        return teamLeads.find(lead => lead.fullName === fullName);
    }

    async getAll(runde: string): Promise<TeamLead[]> {
        try {
            const content = await this.fileStorageService.readFile(this.fileName);
            const data = JSON.parse(content);

            // Get the team leads for the specified runde
            const rundeData = data[runde];
            if (!rundeData) {
                return [];
            }

            return rundeData.map((item: any) => new TeamLead(item.fullName, item.teamName, item.ageClass || "", runde, item.email || ""));
        } catch (err: any) {
            if (err && (err.code === 'ENOENT' || err.message?.includes('not found'))) {
                return [];
            }
            console.error('Error reading test team leads file:', err);
            throw err;
        }
    }
}

describe('FileTeamLeadRepositoryImpl InfraTest', () => {
    let repo: TestFileTeamLeadRepositoryImpl;
    let storageService: LocalFileStorageServiceImpl;
    const testDataDir = path.join(__dirname, '../../../target/test-data');
    const testFilePath = path.join(testDataDir, 'test_team_leads.json');
    const originalCwd = process.cwd();

    beforeEach(() => {
        // Create test directory if it doesn't exist
        if (!fs.existsSync(testDataDir)) {
            fs.mkdirSync(testDataDir, { recursive: true });
        }

        // Create storage service
        storageService = new LocalFileStorageServiceImpl();

        // Change to test directory
        process.chdir(testDataDir);
        repo = new TestFileTeamLeadRepositoryImpl(storageService);
    });

    afterEach(() => {
        // Restore original directory
        process.chdir(originalCwd);

        // Clean up test files
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    it('should_retrieve_team_leads_from_file', async () => {
        // Create test file with sample data grouped by runde
        const sampleData = {
            VR: [
                { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren', email: 'john.smith@example.com' },
                { fullName: 'Maria Mueller', teamName: 'SC Kleckersdorf II', ageClass: 'Damen', email: 'maria.mueller@example.com' },
            ],
            RR: [
                { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren', email: 'john.smith@example.com' },
            ]
        };
        fs.writeFileSync(testFilePath, JSON.stringify(sampleData, null, 2));

        const result = await repo.getAll('VR');

        expect(result).toHaveLength(2);
        expect(result[0].fullName).toBe('John Smith');
        expect(result[1].fullName).toBe('Maria Mueller');
        expect(result[0].runde).toBe('VR');
    });

    it('should_find_team_lead_by_team_name_and_age_class', async () => {
        // Create test file with sample data
        const sampleData = {
            VR: [
                { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren', email: 'john.smith@example.com' },
                { fullName: 'Maria Mueller', teamName: 'SC Kleckersdorf II', ageClass: 'Damen', email: 'maria.mueller@example.com' },
            ]
        };
        fs.writeFileSync(testFilePath, JSON.stringify(sampleData, null, 2));

        const result = await repo.findByTeamNameAndAgeClass('SC Kleckersdorf II', 'Damen', 'VR');

        expect(result).toBeDefined();
        expect(result?.fullName).toBe('Maria Mueller');
        expect(result?.runde).toBe('VR');
    });

    it('should_find_team_lead_by_name_and_surname', async () => {
        // Create test file with sample data
        const sampleData = {
            VR: [
                { fullName: 'Michael Schneider', teamName: 'Jugend M12', ageClass: 'mJ12', email: 'michael.schneider@example.com' },
                { fullName: 'Anna Weber', teamName: 'Jugend W12', ageClass: 'wJ12', email: 'anna.weber@example.com' },
            ]
        };
        fs.writeFileSync(testFilePath, JSON.stringify(sampleData, null, 2));

        const result = await repo.findByName('Anna Weber', 'VR');

        expect(result).toBeDefined();
        expect(result?.teamName).toBe('Jugend W12');
        expect(result?.fullName).toBe('Anna Weber');
        expect(result?.runde).toBe('VR');
    });

    it('should_find_team_lead_by_team_name_and_age_class_in_VR', async () => {
        // Create test file with sample data
        const sampleData = {
            VR: [
                { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren', email: 'john.smith@example.com' },
                { fullName: 'Maria Mueller', teamName: 'SC Kleckersdorf I', ageClass: 'Damen', email: 'maria.mueller@example.com' },
            ]
        };
        fs.writeFileSync(testFilePath, JSON.stringify(sampleData, null, 2));

        const result = await repo.findByTeamNameAndAgeClass('SC Kleckersdorf I', 'Herren', 'VR');

        expect(result).toBeDefined();
        expect(result?.fullName).toBe('John Smith');
        expect(result?.ageClass).toBe('Herren');
        expect(result?.runde).toBe('VR');
    });

    it('should_return_undefined_when_age_class_does_not_match', async () => {
        // Create test file with sample data
        const sampleData = {
            VR: [
                { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren', email: 'john.smith@example.com' },
                { fullName: 'Maria Mueller', teamName: 'SC Kleckersdorf I', ageClass: 'Damen', email: 'maria.mueller@example.com' },
            ]
        };
        fs.writeFileSync(testFilePath, JSON.stringify(sampleData, null, 2));

        const result = await repo.findByTeamNameAndAgeClass('SC Kleckersdorf I', 'Jugend', 'VR');

        expect(result).toBeUndefined();
    });

    it('should_return_empty_array_when_team_lead_not_found', async () => {
        // Don't create the test file

        const result = await repo.getAll('VR');

        expect(result).toEqual([]);
    });

    it('should_return_undefined_when_specific_team_lead_not_found', async () => {
        // Create test file with sample data
        const sampleData = {
            VR: [
                { fullName: 'John Smith', teamName: 'SC Kleckersdorf I', ageClass: 'Herren', email: 'john.smith@example.com' },
            ]
        };
        fs.writeFileSync(testFilePath, JSON.stringify(sampleData, null, 2));

        const result = await repo.findByTeamNameAndAgeClass('Non Existent Team', 'Herren', 'VR');

        expect(result).toBeUndefined();
    });
});

