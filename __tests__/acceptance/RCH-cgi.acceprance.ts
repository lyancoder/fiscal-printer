import { describe } from "mocha";
import { DefaultServer } from "../fixtures/default-server.fixture";
import { Parser } from "xml2js";
import { Server } from "http";
import assert from "assert";
import { text } from "express";
import { RCHXmlHttpClient } from "../../lib/printer/RCH/xml-RCH-http";

describe('RCH-cgi', () => {

    let server: Server;
    let client: RCHXmlHttpClient;

    before(() => {
        const app = DefaultServer.create();
        app.use(text({ type: '*/*' }));
        app.post('/service.cgi', async (req, res) => {
            req.accepts('application/xml');
            req.acceptsCharsets('utf-8');
            const xmlStr = req.body;
            const parser = new Parser({ explicitArray: false, mergeAttrs: true });
            const xmlObj = await parser.parseStringPromise(xmlStr);
            if (xmlObj && Object.keys(xmlObj).length) {
                if (xmlObj['Service']['Request']) {
                    res.type('text/xml').status(200).send(
                        `
                            <?xml version="1.0" encoding="utf-8"?>
                            <Service>
                                <Request>
                                    <errorCode>0</errorCode>
                                    <printerError>0</printerError>
                                    <paperEnd>0</paperEnd>
                                    <coverOpen>0</coverOpen>
                                    <lastCmd>3</lastCmd>
                                    <busy>0</busy>
                                </Request>
                            </Service>
                        `
                    );
                } else {
                    res.status(400).send('unknown body type');
                }
            } else {
                res.status(400).send('unknown body format');
            }
        });
        server = app.listen(80);

        client = new RCHXmlHttpClient({
            host: '192.168.1.96',
        });
    });

    it('Command', async () => {
        const response = await client.executeCommand([
            '=R1/$200/(DOLCE)',
            '=R2/$100/*2/(CAFFE)',
            '=T1'
        ]);
        console.log(response, 'RCH_RES');
        assert.ok(response.ok);
    })

    after(() => {
        server.close();
    })
})