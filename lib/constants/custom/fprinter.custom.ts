import { CustomProtocol } from "./custom.type";

export namespace FPrinterCustom {

    export type Config = {
        host: string;
        fiscalId?:string;
    };

    export type Response = {
        ok: boolean,
        body?: any,
        original?: {
            req: any,
            res: any
        }
    };

    export abstract class Client {

        private readonly config: Config;

        constructor(config: Config) {
            this.config = config;
        }

        getConfig(): Config {
            return this.config;
        }

        abstract printFiscalReceipt(receipt: CustomProtocol.Receipt): Promise<Response>;

        abstract printFiscalReport(report: CustomProtocol.Report): Promise<Response>;

        abstract printCancel(cancel: CustomProtocol.Cancel): Promise<Response>;

        abstract executeCommand(...commands: CustomProtocol.Command[]): Promise<Response>;

    }

}