import { injectable, inject } from "inversify";
import { TeamLead } from "../../domain/model/TeamLead";
import { TeamLeadRepository } from "../../domain/service/TeamLeadRepository";
import { SERVICE_IDENTIFIER } from "../../dependency_injection";
import { FileStorageService } from "../../domain/service/FileStorageService";

/**
 * File-based implementation of TeamLeadRepository.
 * Stores team leads in a local JSON file.
 */
@injectable()
export class FileTeamLeadRepositoryImpl implements TeamLeadRepository {
    private readonly fileName = "team_leads.json";

    constructor(
        @inject(SERVICE_IDENTIFIER.FileStorageService) private readonly fileStorageService: FileStorageService
    ) {}


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
            // FileStorageService.readFile returns a string
            const data = JSON.parse(content);

            // Get the team leads for the specified runde
            const rundeData = data[runde];
            if (!rundeData) {
                return [];
            }

            // Convert plain objects to TeamLead instances
            return rundeData.map((item: any) => new TeamLead(item.fullName, item.teamName, item.ageClass || "", runde, item.email || ""));
        } catch (err: any) {
            if (err && (err.code === 'ENOENT' || err.message?.includes('not found'))) {
                return [];
            }
            console.error('Error reading team leads file:', err);
            throw err;
        }
    }
}

