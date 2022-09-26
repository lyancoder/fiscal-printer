import { describe } from "mocha";
import { DefaultServer } from "../fixtures/default-server.fixture";
import { Parser } from "xml2js";
import { Server } from "http";
import assert from "assert";
import { text } from "express";
import { CustomXmlHttpClient } from "../../lib/printer/custom/xml-custom-http";
import { CustomProtocol } from "../../lib/constants/custom/custom.type";

describe('custom-cgi', () => {

    let server: Server;
    let client: CustomXmlHttpClient;

    before(() => {
        const app = DefaultServer.create();
        app.use(text({ type: '*/*' }));
        app.post('/xml/printer.htm', async (req, res) => {
            req.accepts('text/plain');
            req.acceptsCharsets('utf-8');
            const xmlStr = req.body;
            const parser = new Parser({ explicitArray: false, mergeAttrs: true });
            const xmlObj = await parser.parseStringPromise(xmlStr);
            if (xmlObj && Object.keys(xmlObj).length) {
                if (xmlObj['printerFiscalReceipt']) {
                    res.type('text/xml').status(200).send(
                        `
                        <?xml version="1.0" encoding="utf-8"?>
                            <response success="true" status="2">
                                <addInfo>
                                    <elementList>lastCommand, dateTime, printerStatus, fpStatus, receiptStep, nClose, fiscalDoc</elementList>
                                    <lastCommand>74</lastCommand>
                                    <dateTime>2022-04-20T18:06:21</dateTime>
                                    <printerStatus>20110</printerStatus>
                                    <fpStatus>000</fpStatus>
                                    <receiptStep>0</receiptStep>
                                    <nClose>0972</nClose>
                                    <fiscalDoc>0003</fiscalDoc>
                                </addInfo>
                            </response>
                        `
                    );
                } else if (xmlObj['printerFiscalReport']) {
                    res.type('text/xml').status(200).send(
                        `<?xml version="1.0" encoding="utf-8"?>
                            <response success="true" code="" status="2">
                                <addInfo>
                                    <elementList>lastCommand,printerStatus,zRepNumber,dailyAmount</elementList>
                                    <lastCommand>74</lastCommand>
                                    <printerStatus>20110</printerStatus>
                                    <zRepNumber>764</zRepNumber>
                                    <dailyAmount>176,40</dailyAmount>
                                </addInfo>
                            </response>
                        `
                    );
                } else if (xmlObj['printerCommand']) {
                    res.type('text/xml').status(200).send(
                        `
                            <?xml version="1.0" encoding="utf-8"?>
                                <response success="true" status="x">
                                    <addInfo>
                                        <elementList>lastCommand,printerStatus</elementList>
                                        <lastCommand>74</lastCommand>
                                        <cpuRel>07.00</cpuRel>
                                        <mfRel>04.3</mfRel>
                                        <mfStatus>0</mfStatus>
                                        <fpStatus>00110</fpStatus>
                                    </addInfo>
                                </response>
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

        client = new CustomXmlHttpClient({
            host: '127.0.0.1',
            fiscalId: 'STMTE770228'
        });
    });

    it('Fiscal Receipt', async () => {
        const response = await client.printFiscalReceipt({
            sales: [
                {
                    type: CustomProtocol.ItemType.HOLD,
                    description: 'A',
                    quantity: 1,
                    unitPrice: 5
                },
                {
                    type: CustomProtocol.ItemType.HOLD,
                    description: 'B',
                    quantity: 2,
                    unitPrice: 2.5
                },
                {
                    type: CustomProtocol.ItemType.HOLD,
                    description: 'C',
                    quantity: 3,
                    unitPrice: 3
                },
            ],
            payments: [
                {
                    description: 'Payment in cash',
                    payment: 19
                }
            ]
        });
        console.log(response);
        assert.ok(response.ok);
    })

    it('Cancel Fiscal Report', async () => {
        const response = await client.printCancel({
            type: CustomProtocol.CancelType.VOID,
            zRepNum: '0134',
            docNum: '0001',
            date: '01012022',
            fiscalNum: '11111111111'
        });
        console.log(response);
        assert.ok(response.ok);
    })

    it('Fiscal Report', async () => {
        const response = await client.printFiscalReport({
            type: CustomProtocol.ReportType.DAILY_FISCAL_CLOUSE,
        });
        console.log(response);
        assert.ok(response.ok);
    })

    it('Command', async () => {
        const response = await client.executeCommand({
            code: CustomProtocol.CommandCode.OPEN_DRAWER
        });
        console.log(response);
        assert.ok(response.ok);
    })

    after(() => {
        server.close();
    })

})