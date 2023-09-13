import { RCHProtocol } from "./RCH.type";


export namespace FPrinterRCH {

    export type Config = {
        host: string;
    };

    export type Response = {
        ok: boolean;
        body?: any;
        original?: {
            req: any;
            res: any;
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

        abstract executeCommand(commands: RCHProtocol.Commands): Promise<Response>;

    }

}