import { LocalDateTime } from "@js-joda/core"
import winston from 'winston'
import { LoggerImpl } from "../../../src/adapter/LoggerImpl"
import { ClickTtCsvFileAppointmentParserServiceImpl } from "../../../src/adapter/service/ClickTtCsvFileAppointmentParserServiceImpl"
import { FileStorageService } from "../../../src/domain/service/FileStorageService"

const defaultAppointments = `Termin;Staffel;Runde;HeimMannschaft;HalleStrasse;HalleOrt;HallePLZ;HalleName;GastVereinName;GastMannschaft;BegegnungNr;Altersklasse
10.10.2022 11:45;3. KK West;VR;VfL Hamburg;Lübecker Straße 4;Lübeck;23456;Holstenhalle;SC Lübeck;SC Lübeck III;2;Herren
11.10.2022 11:45;3. KK West;VR;VfL Hamburg;Lübecker Straße 4;Lübeck;23456;Holstenhalle;spielfrei;;2;Herren`

const emptyHalleAppointment = `Termin;Staffel;Runde;HeimMannschaft;HalleStrasse;HalleOrt;HallePLZ;HalleName;GastVereinName;GastMannschaft;BegegnungNr;Altersklasse
12.10.2022 11:45;3. KK West;VR;VfL Hamburg;;;;;spielfrei;;2;Herren`

class TestFileStorageService implements FileStorageService {
    constructor(private readonly fileContent: string) {}

    readFile(filename: string): Buffer {
        return Buffer.from(this.fileContent)
    }
}

class TestLogger extends LoggerImpl {
    constructor() {
        super(new winston.transports.Console())
    }
}

describe('Parse Click-TT CSV file', () => {
    it('should create appointment from CSV data', () => {
        const parser = new ClickTtCsvFileAppointmentParserServiceImpl(new TestFileStorageService(defaultAppointments), new TestLogger())

        // when
        parser.parseAppointments("abc.csv").then(actualAppointments => {
            // then
            expect(actualAppointments.size).toEqual(1);
        })
    })

    it('should ignore "spielfrei" appointments', () => {
        const parser = new ClickTtCsvFileAppointmentParserServiceImpl(new TestFileStorageService(defaultAppointments), new TestLogger())

        // when
        parser.parseAppointments("abc.csv").then(actualAppointments => {
            // then
            expect(actualAppointments.size).toEqual(1);
        })
    })

    it('should show empty address if address fields are not filled', () => {
        const parser = new ClickTtCsvFileAppointmentParserServiceImpl(new TestFileStorageService(emptyHalleAppointment), new TestLogger())

        // when
        parser.parseAppointments("abc.csv").then(actualAppointments => {
            const actualAppointment = actualAppointments.values().next().value

            // then
            expect(actualAppointment.location).toEqual("");
        })
    })

    it('should extract necessary data from CSV data', () => {
        const parser = new ClickTtCsvFileAppointmentParserServiceImpl(new TestFileStorageService(defaultAppointments), new TestLogger())

        // when
        parser.parseAppointments("abc.csv").then(actualAppointments => {
            const actualAppointment = actualAppointments.values().next().value

            // then
            expect(actualAppointment.id).toEqual("ID: 3. KK West-2-VR-2022");
            expect(actualAppointment.ageClass).toEqual("Herren");
            expect(actualAppointment.categories).toEqual(["Click-TT", "Herren", "Liga"]);
            expect(actualAppointment.isCup).toEqual(false);
            expect(actualAppointment.location).toEqual("Holstenhalle, Lübecker Straße 4, 23456 Lübeck");
            expect(actualAppointment.startDateTime).toEqual(LocalDateTime.parse("2022-10-10T11:45"));
            expect(actualAppointment.title).toEqual("VfL Hamburg - SC Lübeck III (Herren)");
        })
    })
})
