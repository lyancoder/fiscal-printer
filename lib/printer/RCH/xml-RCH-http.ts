import axios from "axios";
import * as xmlbuilder from 'xmlbuilder';
import { Parser } from 'xml2js';
import { FPrinterRCH } from "../../constants/RCH/fprinter.RCH";
import { RCHProtocol } from "../../constants/RCH/RCH.type";

export class RCHXmlHttpClient extends FPrinterRCH.Client {

    private static XML_ROOT = 'Service';
    private static XML_BODY = 'cmd';
    private static XML_REQ = 'Request';

    /**
     * send Command to fiscal printer
     * @param commands 
     */
    async executeCommand(commands: RCHProtocol.Commands): Promise<FPrinterRCH.Response> {
        const xmlDoc = this.convertCommandToXmlDoc(commands);
        return this.send(xmlDoc);
    }

    // *********************
    // Emitter
    // *********************

    /**
     * send to the printer server
     * @param xmlDoc
     * @returns 
     */
    private async send(xmlDoc: xmlbuilder.XMLDocument): Promise<FPrinterRCH.Response> {
        // build the printer server url based on config
        const config = this.getConfig();
        let url = `http://${config.host}/service.cgi`;
        // build xml string
        const xmlStr = this.parseRequest(xmlDoc);
        // send
        const resXmlStr: string = await new Promise((resolve, reject) => {
            axios
                .post(url, xmlStr, {
                    headers: {
                        'Content-Type': 'application/xml'
                    }
                })
                .then((res) => {
                    resolve(res.data);
                })
                .catch((err) => {
                    reject(err);
                });
        });
        const response = await this.parseResponse(resXmlStr);
        response.original = {
            req: xmlStr,
            res: resXmlStr
        }
        return response;
    }

    // *********************
    // Parsers
    // *********************

    /**
     * Request Message Format:
     * <?xml version="1.0" encoding="utf-8"?>
     * <Service>
     *      <cmd>
     *          ...
     *      </cmd>
     * </Service>
     * @param xmlDoc
     * @returns 
     */
    private parseRequest(xmlDoc: xmlbuilder.XMLDocument): string {
        const reqXmlStr = xmlDoc.end({ pretty: true });
        return reqXmlStr;
    }

    /**
     * Response Message Format:
     * <?xml version="1.0" encoding="utf-8"?>
     * <Service>
     *      <Request>
     *          <errorCode>0</errorCode>
                <printerError>0</printerError>
                <paperEnd>0</paperEnd>
                <coverOpen>0</coverOpen>
                <lastCmd>2</lastCmd>
                <busy>0</busy>
     *      </Request>
     * </Service>
     * @param xmlStr 
     */
    private async parseResponse(xmlStr: string): Promise<FPrinterRCH.Response> {
        // create xml parser
        let response;
        // explicitArray: Always put child nodes in an array if true; otherwise an array is created only if there is more than one.
        // mergeAttrs: Merge attributes and child elements as properties of the parent, instead of keying attributes off a child attribute object.
        const parser = new Parser({ explicitArray: false, mergeAttrs: true });
        // parse to object
        const xmlObj = await parser.parseStringPromise(xmlStr);
        if (xmlObj && Object.keys(xmlObj).length) {
            // get response data
            response = xmlObj[RCHXmlHttpClient.XML_ROOT][RCHXmlHttpClient.XML_REQ];
        }
        return {
            ok: response && response.errorCode === 0,
            body: response || {}
        }
    }

    // *********************
    // Converters
    // *********************

    /**
     * convert `RCHProtocol.Command` to the object that printer server supports.
     * @param commands
     * @returns 
     */
    private convertCommandToXmlDoc(commands: RCHProtocol.Commands): xmlbuilder.XMLDocument {
        const printerCommand = xmlbuilder.create(RCHXmlHttpClient.XML_ROOT);
        for (const command of commands) {
            printerCommand.ele(RCHXmlHttpClient.XML_BODY).text(command);
        }
        return printerCommand;
    }
}