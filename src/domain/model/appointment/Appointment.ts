import { LocalDateTime } from '@js-joda/core';
import assert from 'assert';

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
    private static CLICK_TT_CATEGORY = "Click-TT"

    /**
     * Ensures that an appointment in a calendar is from the Click-TT system.
     * 
     * @param categories All categories of the appointment
     * @returns true if the appointment is based on Click-TT, false otherwise
     */
    static isFromClickTT(categories: string[]): boolean {
        return categories.find(category => Appointment.CLICK_TT_CATEGORY == category) == Appointment.CLICK_TT_CATEGORY
    }

    constructor(readonly title: string, readonly startDateTime: LocalDateTime, readonly id: string, readonly location: string, readonly isCup: boolean, readonly ageClass: string) {
    }

    get categories(): string[] {
        return [Appointment.CLICK_TT_CATEGORY, this.ageClass, this.isCup ? "Pokal" : "Liga"];
    }

    isSameAs(compareTo: Appointment): boolean {
        if (this.id != compareTo.id) {
            throw new Error("Both events do not belong to the same Click-TT appointment!");
        }

        return this.title == compareTo.title && this.startDateTime.compareTo(compareTo.startDateTime) == 0 && this.ageClass == compareTo.ageClass && this.location == compareTo.location && this.isCup == compareTo.isCup;
    }
}

export class AppointmentFactory {
    static createFromCsv(localTeam: string, foreignTeam: string, startDateTime: LocalDateTime, subLeague: string, matchNumber: number, location: string, ageClass: string, isCup: boolean): AppointmentInterface {
        return new Appointment(localTeam + " - " + foreignTeam + " (" + ageClass + ")", startDateTime, "ID: " + subLeague + "-" + matchNumber, location, isCup, ageClass);
    }

    static createFromCalendar(title: string, startDateTime: LocalDateTime, description: string, location: string, categories: string[]): AppointmentInterface {
        assert(Appointment.isFromClickTT(categories), "needs an appointment based on Click-TT")

        const isCup = categories.filter(category => 'Pokal' == category).length > 0
        const ageClass = title.substring(title.lastIndexOf('(') + 1, title.length - 1);
        const id = description.split("\n").filter(line => line.startsWith('ID: '))[0]

        return new Appointment(title, startDateTime, id, location, isCup, ageClass);
    }
}