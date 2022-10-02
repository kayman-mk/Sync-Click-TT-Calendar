import {DateTimeFormatter, LocalDateTime} from '@js-joda/core';

export class Appointment {
    constructor(readonly title: string, readonly startDateTime: LocalDateTime, readonly id: string, readonly location: string, readonly isCup: boolean) {}
}

export class AppointmentFactory {
    static create(localTeam: string, foreignTeam: string, startDateTime: string, subLeague: string, matchNumber: number, location: string, ageClass: string, isCup: boolean): Appointment {
        const formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

        return new Appointment(localTeam + " - " + foreignTeam + " (" + ageClass + ")", LocalDateTime.parse(startDateTime, formatter), "ID: " + subLeague + "-" + matchNumber, location, isCup);
    }

    static createFromRaw(title: string, startDateTime: LocalDateTime, id: string, location: string, categories: string[]): Appointment {
        const isCup = categories.filter(category => 'Pokal' == category).length > 0
        
        return new Appointment(title, startDateTime, id, location, isCup);
    }
}