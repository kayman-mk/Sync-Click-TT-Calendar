import { LocalDateTime } from '@js-joda/core';
import assert from 'node:assert';

export interface AppointmentInterface {
    get ageClass(): string
    get categories(): string[]
    get isCup(): boolean
    get id(): string
    get location(): string
    get startDateTime(): LocalDateTime
    get title(): string

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
    static isFromClickTT(categories: string[]): boolean {
        return categories.find(category => Appointment.CLICK_TT_CATEGORY == category) == Appointment.CLICK_TT_CATEGORY
    }

    constructor(readonly title: string, readonly startDateTime: LocalDateTime, readonly id: string, readonly location: string, readonly isCup: boolean, readonly ageClass: string, readonly categories: string[]) {
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
        if (this.categories.toString() != compareTo.categories.toString()) differences.push(`categories: [${this.categories.join(', ')}] != [${compareTo.categories.join(', ')}]`);

        if (differences.length > 0) {
            console.log(`Appointment differences for id="${this.id}": ${differences.join('; ')}`);
        }

        return differences.length == 0;
    }

    /**
     * Returns a string representation of the Appointment instance.
     * Includes key fields for easy identification and debugging.
     */
    toString(): string {
        return `Appointment(title="${this.title}", startDateTime="${this.startDateTime}", id="${this.id}", location="${this.location}", isCup=${this.isCup}, ageClass="${this.ageClass}", categories=[${this.categories.join(', ')}])`;
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
        round: string
    }): AppointmentInterface {
        const { localTeam, foreignTeam, startDateTime, subLeague, matchNumber, location, ageClass, isCup, round } = params;
        let categories = [Appointment.CLICK_TT_CATEGORY, isCup ? "Pokal" : "Liga"];

        if (subLeague.endsWith("D")) {
            categories.push("Damen", "Erwachsene");
        } else if (subLeague.endsWith("E")) {
            categories.push("Herren", "Erwachsene");
        } else {
            categories.push("Jugend");
        }

        if (ageClass != "") {
            categories.push(ageClass);
        }

        if (ageClass == "") {
            return new Appointment(localTeam + " - " + foreignTeam, startDateTime, "ID: " + subLeague + "-" + matchNumber + "-" + round + "-" + startDateTime.year(), location, isCup, ageClass, categories);
        } else {
            return new Appointment(localTeam + " - " + foreignTeam + " [" + ageClass + "]", startDateTime, "ID: " + subLeague + "-" + matchNumber + "-" + round + "-" + startDateTime.year(), location, isCup, ageClass, categories);
        }
    }

    static createFromCalendar(title: string, startDateTime: LocalDateTime, description: string, location: string, categories: string[]): AppointmentInterface {
        assert(Appointment.isFromClickTT(categories), "needs an appointment based on Click-TT")

        const isCup = categories.some(category => 'Pokal' == category);
        let ageClass = "";

        // Support both [age] and (age) for backward compatibility
        const bracketMatch = title.match(/\[(.*?)]/);

        if (bracketMatch) {
            ageClass = bracketMatch[1];
        }

        const id = description.split("\n").find(line => line.startsWith('ID: ')) || "";

        return new Appointment(title, startDateTime, id, location, isCup, ageClass, categories);
    }
}
