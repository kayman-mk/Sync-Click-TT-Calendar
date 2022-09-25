# Sync Click-TT Calendar

## Overview
[Click-TT](https://www.click-tt.de) is the portal for all table tennis players in Germany. Unfortunately
they do not offer a shared calendar for your team/club.

This repository offers a command line tool to keep your calendar in sync with all appointments entered
in Click-TT. This is especially useful for large clubs with many teams.

## Usage
Requires NodeJs16+.

```
node index.ts
```

## Roadmap
1. download all appointments for your club from Click-TT (CSV file)
2. download all Click-TT related events from your calendar
3. determine the necessary actions: update, delete, create of appointments
4. execute the actions

## Credits
- [CSV-Parser](https://github.com/mafintosh/csv-parser) - to parse CSV files
- [Js-Joda](https://github.com/js-joda/js-joda) - for date/time handling
- [Winston](https://github.com/winstonjs/winston) - for logging
- [Yargs](https://github.com/yargs/yargs) - a parser for command lines