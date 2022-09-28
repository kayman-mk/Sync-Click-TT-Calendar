import {DateTimeFormatter, LocalDateTime} from '@js-joda/core';

export class Appointment {
    constructor(readonly title: string, readonly startDateTime: LocalDateTime) {}
}

export class AppointmentFactory {
    static create(localTeam: string, foreignTeam: string, startDateTime: string): Appointment {
        const formatter = DateTimeFormatter.ofPattern('dd.MM.yyyy HH:mm');

        return new Appointment("${localTeam} - ${foreignTeam}", LocalDateTime.parse(startDateTime, formatter));
    }
}