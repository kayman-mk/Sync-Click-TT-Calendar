import { Configuration } from "./Configuration";
import { Logger } from "./Logger";

export class UnitOfWork {
    constructor(readonly configuration: Configuration, readonly logger: Logger) {}
}