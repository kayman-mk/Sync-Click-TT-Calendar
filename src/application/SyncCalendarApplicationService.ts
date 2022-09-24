import { Configuration } from "../adapter/Configuration";
import { UnitOfWork } from "../adapter/UnitOfWork";
import { AppointmentParserService } from "../domain/service/AppointmentParserService";

export class SyncCalendarApplicationService {
    constructor(readonly appointmentParserService: AppointmentParserService) {}

    syncCalendar() {
        // parsing ClickTT CSV file
        this.appointmentParserService.parseAppointments();

        // download Calendar Items

        // for each calendar item --> check against Click-TT appointment and do the action

        // for all unprocessed Click-TT items: create them (missing in calendar)
    }
}