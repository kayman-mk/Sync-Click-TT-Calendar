export const SERVICE_IDENTIFIER = {
    SyncCalendarAppService: Symbol.for("SyncCalendarAppSvc"),

    AppointmentParserService: Symbol.for("AppointmentParserService"),
    CalendarService: Symbol.for("CalendarService"),
    Configuration: Symbol.for("Configuration"),
    FileStorageService: Symbol.for("FileStorageService"),
    Logger: Symbol.for("Logger"),
    SportsHallRepository: Symbol.for("SportsHallRepository"),
    SportsHallRemoteService: Symbol.for("SportsHallRemoteService"),
    WebPageService: Symbol.for("WebPageService")
};

export const CONFIGURATION = {
    AppointmentFilename: Symbol.for("AppointmentFilename"),
    CalendarPassword: Symbol.for("CalendarPassword"),
    CalendarUsername: Symbol.for("CalendarUsername"),
    CalendarUrl: Symbol.for("CalendarUrl"),
    ClubName: Symbol.for("ClubName")
}
