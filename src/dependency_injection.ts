export const SERVICE_IDENTIFIER = {
    SyncCalendarAppService: Symbol.for("SyncCalendarAppSvc"),

    AppointmentParserService: Symbol.for("AppointmentParserService"),
    CalendarService: Symbol.for("CalendarService"),
    Configuration: Symbol.for("Configuration"),
    FileStorageService: Symbol.for("FileStorageService"),
    Logger: Symbol.for("Logger")
};

export const CONFIGURATION = {
    AppointmentFilename: Symbol.for("AppointmentFilename"),
    CalendarPassword: Symbol.for("CalendarPassword"),
    CalendarUsername: Symbol.for("CalendarUsername"),
    CalendarUrl: Symbol.for("CalendarUrl")
}