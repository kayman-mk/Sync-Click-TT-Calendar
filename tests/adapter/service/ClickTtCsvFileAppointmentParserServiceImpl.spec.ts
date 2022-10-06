import { Readable } from "stream"
import { Logger } from "../../../src/adapter/Logger"
import { ClickTtCsvFileAppointmentParserServiceImpl } from "../../../src/adapter/service/ClickTtCsvFileAppointmentParserServiceImpl"
import { FileStorageService } from "../../../src/domain/service/FileStorageService"

class TestFileStorageService implements FileStorageService {
    readFile(filename: string): Buffer {
        const csvFile = `Termin;Staffel;Runde;HeimMannschaft;HalleStrasse;HalleOrt;HallePLZ;HalleName;GastVereinName;GastMannschaft;BegegnungNr;Altersklasse
10.10.2022 11:45;3. KK West;VR;VfL Hamburg;Lübecker Straße 4;Lübeck;23456;Holstenhalle;SC Lübeck;SC Lübeck III;2;Herren
11.10.2022 11:45;3. KK West;VR;VfL Hamburg;Lübecker Straße 4;Lübeck;23456;Holstenhalle;spielfrei;;2;Herren`

        return Buffer.from(csvFile)
    }
}

class TestLogger extends Logger {
}

describe('Parse Click-TT CSV file', () => {
    it('should create appointment from CSV data', () => {
        const parser = new ClickTtCsvFileAppointmentParserServiceImpl(new TestFileStorageService(), new TestLogger())

        // when
        parser.parseAppointments("abc.csv").then(actualAppointments => {
            // then
            expect(actualAppointments.size).toEqual(1);
        })
    })

    it('should ignore "spielfrei" appointments', () => {
        const parser = new ClickTtCsvFileAppointmentParserServiceImpl(new TestFileStorageService(), new TestLogger())

        // when
        parser.parseAppointments("abc.csv").then(actualAppointments => {
            // then
            expect(actualAppointments.size).toEqual(1);
        })
    })

    it('should extract necessary data from CSV data', () => {
        const parser = new ClickTtCsvFileAppointmentParserServiceImpl(new TestFileStorageService(), new TestLogger())

        // when
        parser.parseAppointments("abc.csv").then(actualAppointments => {
            const actualAppointment = actualAppointments.values().next().value

            // then
            expect(actualAppointment.id).toEqual("ID: 1");
        })
    })
})