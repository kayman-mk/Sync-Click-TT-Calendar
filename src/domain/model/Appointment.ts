import { LocalDateTime } from '@js-joda/core';
import assert from 'node:assert';
import { TeamLead } from './TeamLead';

export interface AppointmentInterface {
    get ageClass(): string
    get categories(): Set<string>
    get isCup(): boolean
    get id(): string
    get location(): string
    get startDateTime(): LocalDateTime
    get title(): string
    get description(): string
    get subLeague(): string
    get matchNumber(): number
    get round(): string
    get teamLead(): TeamLead

    /**
     * Checks if the appointment differs from compareTo
     *
     * Note: Both appointments must have the same id field. Otherwise an error is thrown.
     *
     * @param compareTo the appointment to compare to
     * @return true if both Appointments differ
     */
    isSameAs(compareTo: Appointment): boolean;
}

export class Appointment implements AppointmentInterface {
    public static readonly CLICK_TT_CATEGORY = "Click-TT"

    /**
     * Ensures that an appointment in a calendar is from the Click-TT system.
     *
     * @param categories All categories of the appointment
     * @returns true if the appointment is based on Click-TT, false otherwise
     */
    static isFromClickTT(categories: Set<string>): boolean {
        return categories.has(Appointment.CLICK_TT_CATEGORY)
    }

    /**
     * Determines the competition round (VR or RR) based on the date.
     * VR (Vorrunde/first half): January-April (months 1-4)
     * RR (Rückrunde/second half): May-December (months 5-12)
     *
     * @param date The date to determine the round for
     * @returns 'VR' for months 1-4, 'RR' for months 5-12
     */
    static getRunde(date: LocalDateTime): string {
        const month = date.monthValue();
        return month >= 1 && month <= 4 ? 'VR' : 'RR';
    }

    constructor(readonly title: string, readonly startDateTime: LocalDateTime, readonly location: string, readonly isCup: boolean, readonly ageClass: string, readonly categories: Set<string>, readonly subLeague: string, readonly matchNumber: number, readonly round: string, readonly id: string = "", readonly teamLead: TeamLead) {
        if (id == "") {
            this.id = this.subLeague + "-" + this.matchNumber + "-" + this.round + "-" + this.startDateTime.year();
        }
    }

    isSameAs(compareTo: Appointment): boolean {
        if (this.id != compareTo.id) {
            throw new Error("Both events do not belong to the same Click-TT appointment!");
        }

        const differences: string[] = [];
        if (this.title != compareTo.title) differences.push(`title: "${this.title}" != "${compareTo.title}"`);
        if (this.startDateTime.compareTo(compareTo.startDateTime) != 0) differences.push(`startDateTime: "${this.startDateTime}" != "${compareTo.startDateTime}"`);
        if (this.ageClass != compareTo.ageClass) differences.push(`ageClass: "${this.ageClass}" != "${compareTo.ageClass}"`);
        if (this.location != compareTo.location) differences.push(`location: "${this.location}" != "${compareTo.location}"`);
        if (this.isCup != compareTo.isCup) differences.push(`isCup: ${this.isCup} != ${compareTo.isCup}`);

        const categoriesDifferent = this.categories.size !== compareTo.categories.size ||
            ![...this.categories].every(c => compareTo.categories.has(c));
        if (categoriesDifferent) differences.push(`categories: [${Array.from(this.categories).join(', ')}] != [${Array.from(compareTo.categories).join(', ')}]`);

        if (this.teamLead.fullName != compareTo.teamLead.fullName) differences.push(`teamLead: "${this.teamLead.fullName}" != "${compareTo.teamLead.fullName}"`);

        return differences.length == 0;
    }

    /**
     * Returns a string representation of the Appointment instance.
     * Includes key fields for easy identification and debugging.
     */
    toString(): string {
        return `Appointment(title="${this.title}", startDateTime="${this.startDateTime}", id="${this.id}", location="${this.location}", isCup=${this.isCup}, ageClass="${this.ageClass}", categories=[${Array.from(this.categories).join(', ')}])`;
    }

    get description(): string {
        return `Mannschaftsführer: ${this.teamLead.fullName}\n\nKategorien: ${Array.from(this.categories).join(', ')}\n\nID: ${this.id}`;
    }
}

export class AppointmentFactory {
    static createFromCsv(params: {
        localTeam: string,
        foreignTeam: string,
        startDateTime: LocalDateTime,
        subLeague: string,
        matchNumber: number,
        location: string,
        ageClass: string,
        isCup: boolean,
        round: string,
        teamLead: TeamLead
    }): AppointmentInterface {
        const { localTeam, foreignTeam, startDateTime, subLeague, matchNumber, location, ageClass, isCup, round, teamLead } = params;
        let categories = new Set([Appointment.CLICK_TT_CATEGORY, isCup ? "Pokal" : "Liga"]);

        if (subLeague.endsWith("D")) {
            categories.add("Damen");
            categories.add("Erwachsene");
        } else if (subLeague.endsWith("E")) {
            categories.add("Herren");
            categories.add("Erwachsene");
        } else {
            categories.add("Jugend");
        }

        if (ageClass != "" && !subLeague.endsWith("D")) {
            categories.add(ageClass);
        }

        if (ageClass == "") {
            return new Appointment(localTeam + " - " + foreignTeam, startDateTime, location, isCup, ageClass, categories, subLeague, matchNumber, round, "", teamLead);
        } else {
            return new Appointment(localTeam + " - " + foreignTeam + " [" + ageClass + "]", startDateTime, location, isCup, ageClass, categories, subLeague, matchNumber, round, "", teamLead);
        }
    }

    static createFromCalendar(title: string, startDateTime: LocalDateTime, description: string, location: string, categories: Set<string>, teamLead: TeamLead): AppointmentInterface {
        assert(Appointment.isFromClickTT(categories), "needs an appointment based on Click-TT")

        const isCup = categories.has('Pokal');
        let ageClass = "";

        const bracketMatch = title.match(/\[(.*?)]/);

        if (bracketMatch) {
            ageClass = bracketMatch[1];
        }

        const id = description.split("\n").find(line => line.startsWith('ID: '))?.replace("ID: ", "") || "";

        return new Appointment(title, startDateTime, location, isCup, ageClass, categories, "", 0, "", id, teamLead);
    }
}
