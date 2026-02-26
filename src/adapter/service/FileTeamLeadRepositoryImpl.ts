import { injectable, inject } from "inversify";
import { TeamLead } from "../../domain/model/TeamLead";
import { TeamLeadRepository } from "../../domain/service/TeamLeadRepository";
import { SERVICE_IDENTIFIER } from "../../dependency_injection";
import { FileStorageService } from "../../domain/service/FileStorageService";
import { Logger } from "../../domain/service/Logger";
import { FileCachedRepository } from "./CachedRepository";

/**
 * File-based implementation of TeamLeadRepository using FileCachedRepository.
 * Stores team leads in a local JSON file.
 */
@injectable()
export class FileTeamLeadRepositoryImpl extends FileCachedRepository<TeamLead> implements TeamLeadRepository {
    constructor(
        filePath: string,
        @inject(SERVICE_IDENTIFIER.FileStorageService) fileStorageService: FileStorageService,
        @inject(SERVICE_IDENTIFIER.Logger) logger: Logger
    ) {
        super(filePath, fileStorageService, logger);
    }

    protected isSamePrimaryKey(a: TeamLead, b: TeamLead): boolean {
        // TeamLead is uniquely identified by fullName, teamName, ageClass, and runde
        return (
            a.fullName === b.fullName &&
            a.teamName === b.teamName &&
            a.ageClass === b.ageClass &&
            a.runde === b.runde
        );
    }

    // Override deserialize to handle runde-keyed JSON structure
    protected deserialize(content: string): TeamLead[] {
        const data = JSON.parse(content);
        const result: TeamLead[] = [];
        for (const runde of Object.keys(data)) {
            const leads = data[runde] || [];
            for (const item of leads) {
                result.push(new TeamLead(
                    item.fullName,
                    item.teamName,
                    item.ageClass || "",
                    runde,
                    item.email || ""
                ));
            }
        }
        return result;
    }

    async findByTeamNameAndAgeClass(teamName: string, ageClass: string, runde: string): Promise<TeamLead | undefined> {
        return this.getAll().then(teamLeads => teamLeads.find(lead => lead.teamName === teamName && lead.ageClass === ageClass && lead.runde === runde));
    }

    async findByName(fullName: string, runde: string): Promise<TeamLead | undefined> {
        return this.getAll().then(teamLeads => teamLeads.find(lead => lead.fullName === fullName && lead.runde === runde));
    }

    async getAllByRunde(runde: string): Promise<TeamLead[]> {
        return this.getAll().then(teamLeads => teamLeads.filter(lead => lead.runde === runde));
    }
}
