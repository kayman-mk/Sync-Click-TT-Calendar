import { injectable, inject } from "inversify";
import { SportsHall } from "../../domain/model/SportsHall";
import { Club } from "../../domain/model/Club";
import { SportsHallRemoteService } from "../../domain/service/SportsHallRemoteService";
import { WebPageService } from "../../domain/service/WebPageService";
import { Logger } from "../../domain/service/Logger";
import { SERVICE_IDENTIFIER } from "../../dependency_injection";
import * as cheerio from "cheerio";

/**
 * Interface representing a Spiellokal block extracted from HTML.
 * Contains the title and the HTML container for the address information.
 */
interface SpiellokalBlock {
    title: string;
    addressDiv: cheerio.Cheerio<any>;
}

/**
 * Interface representing parsed address components.
 */
interface AddressComponents {
    description: string;
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
}

/**
 * Implementation of SportsHallRemoteService that fetches and parses HTML content.
 * Uses WebPageService to handle HTTP communication in a decoupled manner.
 */
@injectable()
export class HttpSportsHallRemoteService implements SportsHallRemoteService {
    constructor(
        @inject(SERVICE_IDENTIFIER.WebPageService) private readonly webPageService: WebPageService,
        @inject(SERVICE_IDENTIFIER.Logger) private readonly logger: Logger
    ) {}

    async fetchSportsHalls(club: Club): Promise<SportsHall[]> {
        try {
            const html = await this.webPageService.fetchPage(`${club.url}/info`);
            const adressenSection = this.extractAdressenSection(html);

            if (!adressenSection.length) {
                this.logger.error("Adressen section not found in HTML");
                return [];
            }

            const spiellokalBlocks = this.extractSpiellokalBlocks(adressenSection);
            return spiellokalBlocks.map(block => this.parseSpiellokal(block, club.name));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            this.logger.error(`Failed to fetch sports halls from ${club.url}/info: ${errorMessage}`);
            throw err;
        }
    }

    /**
     * Extracts all Spiellokal blocks from the Adressen section.
     * Each block contains information about one sports hall.
     *
     * @param adressenSection - Cheerio collection of the Adressen section
     * @returns Array of Spiellokal block objects with raw data
     */
    private extractSpiellokalBlocks(adressenSection: cheerio.Cheerio<any>): SpiellokalBlock[] {
        const blocks: SpiellokalBlock[] = [];
        const $ = cheerio.load(adressenSection.html() || "");

        $("span.font-semibold").each((_, elem) => {
            const title = $(elem).text().trim();
            const match = /^Spiellokal\s*(\d+)/.exec(title);

            if (!match) return;

            const addressDiv = $(elem).next("div");
            blocks.push({ title, addressDiv });
        });

        return blocks;
    }

    /**
     * Parses a single Spiellokal block into a SportsHall object.
     * Handles address extraction and formatting.
     *
     * @param block - Spiellokal block with title and addressDiv
     * @param clubName - Name of the club for the SportsHall
     * @returns Parsed SportsHall object
     */
    private parseSpiellokal(block: SpiellokalBlock, clubName: string): SportsHall {
        // Extract sport hall number from title
        const match = /^Spiellokal\s*(\d+)/.exec(block.title);
        const sportshallNumber = match ? Number.parseInt(match[1], 10) : 0;

        const address = this.extractAddressFromBlock(block.addressDiv);

        return {
            club: clubName,
            sportshallNumber,
            postalCode: address.postalCode,
            city: address.city,
            street: address.street,
            houseNumber: address.houseNumber,
            name: address.description
        };
    }

    /**
     * Extracts address components from a Spiellokal block.
     * Parses street, house number, postal code, and city from HTML.
     *
     * @param addressDiv - Cheerio collection containing the address information
     * @returns Object with parsed address components
     */
    private extractAddressFromBlock(addressDiv: cheerio.Cheerio<any>): AddressComponents {
        const descDiv = addressDiv.find(".pb-4").first();
        const description = descDiv.contents().first().text().trim();
        const mapLink = descDiv.find("a").first();
        const addressLines = mapLink.html()?.split("<br>") || [];

        let street = "", houseNumber = "", postalCode = "", city = "";

        if (addressLines.length >= 2) {
            // First line: street and house number
            const $ = cheerio.load("<div>" + addressLines[0] + "</div>");
            const streetParts = $.text().trim().split(" ");

            if (streetParts.length > 1) {
                houseNumber = streetParts.pop() || "";
                street = streetParts.join(" ");
            } else if (streetParts.length === 1) {
                street = streetParts[0];
            }

            // Second line: postal code and city
            const $city = cheerio.load("<div>" + addressLines[1] + "</div>");
            const cityParts = $city.text().trim().split(" ");
            postalCode = cityParts.shift() || "";
            city = cityParts.join(" ");
        }

        return { description, street, houseNumber, postalCode, city };
    }

    /**
     * Extracts the Adressen section from the HTML document.
     *
     * @param html - The HTML content to parse
     * @returns The Adressen section element, or an empty Cheerio collection if not found
     */
    private extractAdressenSection(html: string): cheerio.Cheerio<any> {
        const $ = cheerio.load(html);

        return $("h2").filter((_, el) => $(el).text().trim() === "Adressen").parent();
    }
}
