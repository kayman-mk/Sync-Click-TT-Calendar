import { DateTimeFormatter, LocalDateTime } from '@js-joda/core';

export interface AppointmentInterface {
    getId(): string;
    getLocation(): string;
    getCategories(): string[];
getStartDateTime(): LocalDateTime;
getTitle(): string;

    needsUpdate(compareTo: Appointment): boolean;
}

export class Appointment implements AppointmentInterface {
    private id: string;

    constructor(readonly title: string, readonly startDateTime: LocalDateTime, id: string, readonly location: string, readonly isCup: boolean, readonly ageClass: string) {
        this.id = id;
    }

    getTitle(): string {
        return this.title;
    }

    getStartDateTime(): LocalDateTime {
        return this.startDateTime;
    }

    getId(): string {
        return this.id;
    }

    getLocation(): string {
        return this.location;
    }

    getCategories(): string[] {
        const categories = ["Click-TT", this.ageClass];

        if (this.isCup) {
            categories.push("Pokal");
        } else {
            categories.push("Liga");
        }

        return categories;
    }

    needsUpdate(compareTo: Appointment): boolean {
        if (this.id != compareTo.id) {
            throw new Error("Make no update check if both events to not belong to the same Click-TT event");
        }

        return this.title != compareTo.title || this.startDateTime.compareTo(compareTo.startDateTime) != 0 || this.ageClass != compareTo.ageClass || this.location != compareTo.location || this.isCup != compareTo.isCup;
    }
}

export class AppointmentFactory {
    static create(localTeam: string, foreignTeam: string, startDateTime: string, subLeague: string, matchNumber: number, location: string, ageClass: string, isCup: boolean): Appointment {
        const formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

        return new Appointment(localTeam + " - " + foreignTeam + " (" + ageClass + ")", LocalDateTime.parse(startDateTime, formatter), "ID: " + subLeague + "-" + matchNumber, location, isCup, ageClass);
    }

    static createFromRaw(title: string, startDateTime: LocalDateTime, id: string, location: string, categories: string[]): Appointment {
        const isCup = categories.filter(category => 'Pokal' == category).length > 0
        const ageClass = title.substring(title.lastIndexOf('(') + 1, title.length - 1);

        return new Appointment(title, startDateTime, id, location, isCup, ageClass);
    }
}