# Sync Click-TT Calendar

## Overview
[Click-TT](https://www.click-tt.de) is the portal for all table tennis players in Germany. Unfortunately
they do not offer a shared calendar for your team/club.

This repository offers a command line tool to keep your calendar in sync with all appointments entered
in Click-TT. This is especially useful for large clubs with many teams.

## Click-TT
The appointment file containing all appointments of your sports club can be found at: Downloads > Vereinsspielplan (csv). This require at least a login.
## Usage
Requires NodeJs 16+.

```
npm run build && CALENDAR_USERNAME=caldav_user CALENDAR_PASSWORD=caldav_password node target/src/index.js -f click-tt-appointments.csv -c https://my.caldav.local/
```

The environment variables `CALENDAR_USERNAME` and `CALENDAR_PASSWORD` are used for authentication against your CalDav calendar which shall be updated.

Command line parameters:
- `-f` or `--appointment-file`: the file downloaded from Click-TT containing the appoints for your sports club
- `-c` or `--calendar-url`: the Url for the calendar to update

## Features
### Done
- synchronise your CalDav calendar with the appointments from Click-TT

### planned
- set the organizer of the appointment to the team lead

## Credits
- [CSV-Parser](https://github.com/mafintosh/csv-parser) - to parse CSV files
- [Ical](https://github.com/kewisch/ical.js) - to parse ics calendar events from a calendar
- [Ics](https://github.com/adamgibbons/ics) - to handle ics calendar events
- [InversifyJS](https://github.com/inversify/InversifyJS) - for dependency injection
- [Js-Joda](https://github.com/js-joda/js-joda) - for date/time handling
- [Reflect-Metadata](https://github.com/rbuckton/reflect-metadata) - for dependency injection
- [TsDav](https://github.com/natelindev/tsdav) - to access CalDav calendars
- [Winston](https://github.com/winstonjs/winston) - for logging
- [Yargs](https://github.com/yargs/yargs) - a parser for command lines