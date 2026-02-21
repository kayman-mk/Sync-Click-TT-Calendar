import { injectable } from "inversify";
import { SportsHall } from "../../domain/model/SportsHall";
import { Club } from "../../domain/model/Club";
import { SportsHallRemoteService } from "../../domain/service/SportsHallRemoteService";
import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Implementation of SportsHallRemoteService using HTTP GET and JSON response.
 * Assumes the remote endpoint returns an array of SportsHall objects.
 */
@injectable()
export class HttpSportsHallRemoteService implements SportsHallRemoteService {
    async fetchSportsHalls(club: Club): Promise<SportsHall[]> {
        try {
            const response = await axios.get(`${club.url}/info`);
            const html = response.data;
            const $ = cheerio.load(html);
            const halls: SportsHall[] = [];
            // Find the Adressen section by <h2>
            const adressenSection = $("h2").filter((_, el) => $(el).text().trim() === "Adressen").parent();
            if (!adressenSection.length) {
                // Adressen section not found in HTML, log and return empty array
                console.error("Adressen section not found in HTML");
                return [];
            }
            // Only search for Spiellokal blocks within the Adressen section
            adressenSection.find(".font-semibold").each((_, elem) => {
                const title = $(elem).text().trim();
                const match = /^Spiellokal\s*(\d+)/.exec(title);
                if (!match) return;
                const sportshallNumber = Number.parseInt(match[1], 10);
                // Address block is the next sibling div
                const addressDiv = $(elem).next("div");
                const descDiv = addressDiv.find(".pb-4").first();
                const description = descDiv.contents().first().text().trim();
                const mapLink = descDiv.find("a").first();
                const addressLines = mapLink.html()?.split("<br>") || [];
                let street = "", houseNumber = "", postalCode = "", city = "";
                if (addressLines.length >= 2) {
                    // First line: street and house number
                    const streetParts = $("<div>" + addressLines[0] + "</div>").text().trim().split(" ");
                    if (streetParts.length > 1) {
                        houseNumber = streetParts.pop() || "";
                        street = streetParts.join(" ");
                    } else if (streetParts.length === 1) {
                        street = streetParts[0];
                        // houseNumber already initialized as ""
                    }
                    // Second line: postal code and city
                    const cityParts = $("<div>" + addressLines[1] + "</div>").text().trim().split(" ");
                    postalCode = cityParts.shift() || "";
                    city = cityParts.join(" ");
                }
                halls.push({
                    club: club.name,
                    sportshallNumber,
                    postalCode,
                    city,
                    street,
                    houseNumber,
                    name: description
                });
            });
            return halls;
        } catch (err) {
            console.error(`Failed to fetch sports halls from ${club.url}/info:`, err);
            throw err;
        }
    }
}
