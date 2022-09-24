import {LocalDateTime} from '@js-joda/core';

export class Appointment {
    constructor(readonly title: String, readonly description: String, readonly gameCount: Number, readonly localTeamName: String, readonly foreignTeamName: String, readonly startDateTime: LocalDateTime) {}
}

export class AppointmentFactory {
    static createFromClickTTCsv(data: any): Appointment {
        return new Appointment('title', 'description', 4, 'localTeam', 'foreignTeam', LocalDateTime.of(2022, 1, 1));
    }
}