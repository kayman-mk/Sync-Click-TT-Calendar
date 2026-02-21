# Sync Click-TT Calendar

## Overview
[Click-TT](https://www.click-tt.de) is the portal for all table tennis players in Germany. Unfortunately
they do not offer a shared calendar for your team/club.

This repository offers a command line tool to keep your calendar in sync with all appointments entered
in Click-TT. This is especially useful for large clubs with many teams.

## Click-TT and myTischtennis.de
### Click-TT
The appointment file containing all appointments of your sports club can be found at: Downloads > Vereinsspielplan (csv). This requires at least a login.

### myTischtennis.de
Alternatively, you can sync directly from your club's public myTischtennis.de page. The URL format is typically:
`https://mytischtennis.de/clicktt/[region]/[season]/[club-id]/`

## Usage
Requires NodeJs 16+.

### Option 1: Using a downloaded CSV file from Click-TT
```
npm run build && CALENDAR_USERNAME=caldav_user CALENDAR_PASSWORD=caldav_password node target/src/index.js -f click-tt-appointments.csv -c https://my.caldav.local/
```

### Option 2: Using myTischtennis.de URL
```
npm run build && CALENDAR_USERNAME=caldav_user CALENDAR_PASSWORD=caldav_password node target/src/index.js -u https://mytischtennis.de/clicktt/[region]/[season]/[club-id]/ -c https://my.caldav.local/
```

The environment variables `CALENDAR_USERNAME` and `CALENDAR_PASSWORD` are used for authentication against your CalDav calendar which shall be updated.

## Environment Variables

This project uses a `.env` file for configuration. Create a `.env` file in the project root (see `.env.example` for template) and add your environment variables, e.g.:

```
CALENDAR_USERNAME=your_caldav_username
CALENDAR_PASSWORD=your_caldav_password
```

Environment variables in `.env` are loaded automatically at runtime.
Command line parameters (mutually exclusive):
- `-f` or `--appointment-file`: the CSV file downloaded from Click-TT containing the appointments for your sports club
- `-u` or `--mytischtennis-url`: the URL of your club's myTischtennis.de page to download and parse appointments directly
- `-c` or `--calendar-url`: the URL for the calendar to update (required)

**Note**: You must provide either `-f` or `-u`, but not both.

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
