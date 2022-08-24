import axios from "axios";
import { Fiscal } from "../../constants/fiscal.type";
import { FPrinter } from "../../constants/fprinter.type";
import * as xmlbuilder from 'xmlbuilder';
import { Parser } from 'xml2js';

export class EpsonXmlHttpClient extends FPrinter.Client {

    private static XML_ROOT = 's:Envelope';
    private static XML_BODY = 's:Body';
    private static XML_RES_ROOT = 'soapenv:Envelope';
    private static XML_RES_BODY = 'soapenv:Body';
    private static XML_RESPONSE = 'response';
    private static COMMAND_CODE = {
        [Fiscal.CommandCode.OPEN_DRAWER]: (printerCommand: xmlbuilder.XMLElement, command: Fiscal.Command) => {
            printerCommand.ele('openDrawer', {
                operator: command.data?.operator ?? 1
            });
        }, 
        [Fiscal.CommandCode.QUERY_PRINTER_STATUS]: (printerCommand: xmlbuilder.XMLElement, command: Fiscal.Command) => {
            printerCommand.ele('queryPrinterStatus', {
                operator: command.data?.operator ?? 1,
                statusType: command.data?.statusType ?? 0
            });
        }, 
        [Fiscal.CommandCode.REBOOT_WEB_SERVER]: (printerCommand: xmlbuilder.XMLElement, command: Fiscal.Command) => {
            printerCommand.ele('rebootWebServer', {
                operator: command.data?.operator ?? 1
            });
        }, 
        [Fiscal.CommandCode.RESET_PRINTER]: (printerCommand: xmlbuilder.XMLElement, command: Fiscal.Command) => {
            printerCommand.ele('resetPrinter', {
                operator: command.data?.operator ?? 1
            });
        }, 
        [Fiscal.CommandCode.GET_NATIVE_CODE_FUNCTION]: (printerCommand: xmlbuilder.XMLElement, command: Fiscal.Command) => {
            printerCommand.ele('directIO', {
                command: command.data?.command ?? '0000',
                data: command.data?.operator ?? '01',
                timeout: command.data?.timeout ?? '6000',
                comment: command.data?.comment ?? ''
            });
        }, 
    }

    /**
     * commercial document
     * @param receipt 
     */
    async printFiscalReceipt(receipt: Fiscal.Receipt): Promise<FPrinter.Response> {
        const xmlDoc = this.convertReceiptToXmlDoc(receipt);
        return this.send(xmlDoc);
    }

    /**
     * daily closure (X and Z reports)
     * @param report 
     */
    async printFiscalReport(report: Fiscal.Report): Promise<FPrinter.Response> {
        const xmlDoc = this.convertReportToXmlDoc(report);
        return this.send(xmlDoc);
    }

    /**
     * print a commercial refund/void document
     * @param cancel 
     */
    async printCancel(cancel: Fiscal.Cancel): Promise<FPrinter.Response> {
        const xmlDoc = this.convertCancelToXmlDoc(cancel);
        return this.send(xmlDoc);
    }

    /**
     * management document
     * @param nonFiscal 
     */
    // async printNonFiscal(nonFiscal: Fiscal.NonFiscal): Promise<FPrinter.Response> {
    //     const xmlDoc = this.convertNonFiscalToXmlDoc(nonFiscal);
    //     return this.send(xmlDoc);
    // }

    /**
     * fiscal document
     * @param invoice 
     */
    // async printInvoice(invoice: Fiscal.Invoice): Promise<FPrinter.Response> {
    //     const xmlDoc = this.convertInvoiceToXmlDoc(invoice);
    //     return this.send(xmlDoc);
    // }

    /**
     * send Command to fiscal printer
     * @param commands 
     */
    async executeCommand(...commands: Fiscal.Command[]): Promise<FPrinter.Response> {
        const xmlDoc = this.convertCommandToXmlDoc(...commands);
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
    private async send(xmlDoc: xmlbuilder.XMLDocument): Promise<FPrinter.Response> {
        // build the printer server url based on config
        const config = this.getConfig();
        let url = `http://${config.host}/cgi-bin/fpmate.cgi`;
        let prefix = '?';
        if (config.deviceId) {
            url += `${prefix}devid=${config.deviceId}`;
            prefix = '&';
        }
        if (config.timeout && config.timeout > 0) {
            url += `${prefix}timeout=${config.timeout}`;
        }
        // build xml string
        const xmlStr = this.parseRequest(xmlDoc);
        // send
        const resXmlStr: string = await new Promise((resolve, reject) => {
            axios
                .post(url, xmlStr, {
                    headers: {
                        'Content-Type': 'text/xml;charset=utf-8'
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
     * <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
     *      <s:Body>
     *          ...
     *      </s:Body>
     * </s:Envelope>
     * @param xmlDoc
     * @returns 
     */
    private parseRequest(xmlDoc: xmlbuilder.XMLDocument): string {
        const reqXmlStr = xmlbuilder
            .create(EpsonXmlHttpClient.XML_ROOT, { version: '1.0', encoding: 'utf-8' })
            .att('xmlns:s', 'http://schemas.xmlsoap.org/soap/envelope/')
            .ele(EpsonXmlHttpClient.XML_BODY)
            .importDocument(xmlDoc)
            .end({ pretty: true });
        return reqXmlStr;
    }

    /**
     * Response Message Format:
     * <?xml version="1.0" encoding="utf-8"?>
     * <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
     *      <s:Body>
     *          <response success="true" code="" status="xxxxx" />
     *      </s:Body>
     * </s:Envelope>
     * @param xmlStr 
     */
    private async parseResponse(xmlStr: string): Promise<FPrinter.Response> {
        // create xml parser
        let response;
        // explicitArray: Always put child nodes in an array if true; otherwise an array is created only if there is more than one.
        // mergeAttrs: Merge attributes and child elements as properties of the parent, instead of keying attributes off a child attribute object.
        const parser = new Parser({ explicitArray: false, mergeAttrs: true });
        // parse to object
        const xmlObj = await parser.parseStringPromise(xmlStr);
        if (xmlObj && xmlObj[EpsonXmlHttpClient.XML_RES_ROOT] && xmlObj[EpsonXmlHttpClient.XML_RES_ROOT][EpsonXmlHttpClient.XML_RES_BODY]) {
            // get response data
            response = xmlObj[EpsonXmlHttpClient.XML_RES_ROOT][EpsonXmlHttpClient.XML_RES_BODY][EpsonXmlHttpClient.XML_RESPONSE];
        }
        return {
            ok: response && response.success === 'true' ? true : false,
            body: response || {}
        }
    }

    // *********************
    // Converters
    // *********************

    /**
     * convert `Fiscal.Receipt` to the object that xml2js builder and cgi server supports.
     * @param receipt 
     * @returns 
     */
    private convertReceiptToXmlDoc(receipt: Fiscal.Receipt): xmlbuilder.XMLDocument {
        // init
        const printerFiscalReceipt = xmlbuilder.create('printerFiscalReceipt');
        // begin
        printerFiscalReceipt.ele('beginFiscalReceipt', { operator: receipt.operator ?? 1 });
        // sales
        if (receipt.sales && receipt.sales.length > 0) {
            for (const sale of receipt.sales) {
                // sale or return
                if (sale.type === Fiscal.ItemType.HOLD) {
                    // item adjustment
                    if (sale.operations && sale.operations.length > 0) {
                        for (const operation of sale.operations) {
                            printerFiscalReceipt.ele('printRecItemAdjustment', {
                                operator: operation.operator ?? 1,
                                description: operation.description ?? '',
                                department: operation.department ?? 1,
                                justification: operation.justification ?? 1,
                                amount: operation.amount,
                                adjustmentType: ((t: number): number => {
                                    switch (t) {
                                        case 0:
                                            return 0;
                                        case 1:
                                            return 3;
                                        case 4:
                                            return 5;
                                        case 5:
                                            return 8;
                                        case 8:
                                            return 10;
                                        case 9:
                                            return 11;
                                        case 10:
                                            return 12;
                                        default:
                                            return 0;
                                    }
                                })(operation.type)
                            });
                        }
                    }
                    // item
                    printerFiscalReceipt.ele('printRecItem', {
                        operator: sale.operator ?? 1,
                        description: sale.description ?? '',
                        quantity: sale.quantity,
                        unitPrice: sale.unitPrice,
                        department: sale.department ?? 1,
                        justification: sale.justification ?? 1
                    });
                } else if (sale.type === Fiscal.ItemType.CANCEL) {
                    // void item adjustment
                    if (sale.operations && sale.operations.length > 0) {
                        for (const operation of sale.operations) {
                            printerFiscalReceipt.ele('printRecItemAdjustmentVoid', {
                                operator: operation.operator ?? 1
                            });
                        }
                    }
                    // void item
                    printerFiscalReceipt.ele('printRecItemVoid', {
                        operator: sale.operator ?? 1,
                        description: sale.description ?? '',
                        quantity: sale.quantity,
                        unitPrice: sale.unitPrice,
                        department: sale.department ?? 1,
                        justification: sale.justification ?? 1
                    });
                }
            }
        }
        // refunds
        if (receipt.refunds && receipt.refunds.length > 0) {
            for (const refund of receipt.refunds) {
                if (refund.type === Fiscal.ItemType.HOLD) {
                    if (refund.operation) {
                        printerFiscalReceipt.ele('printRecRefund', {
                            operator: refund.operator ?? 1,
                            description: refund.description ?? '',
                            operationType: ((t: number): number => {
                                switch (t) {
                                    case 8:
                                        return 10;
                                    case 9:
                                        return 11;
                                    case 10:
                                        return 12;
                                    default:
                                        return 10;
                                }
                            })(refund.type),
                            amount: refund.amount ?? 0,
                            department: refund.department ?? 1,
                            justification: refund.justification ?? 1
                        });
                    } else {
                        printerFiscalReceipt.ele('printRecRefund', {
                            operator: refund.operator ?? 1,
                            description: refund.description ?? '',
                            quantity: refund.quantity ?? 1,
                            unitPrice: refund.unitPrice ?? 0,
                            department: refund.department ?? 1,
                            justification: refund.justification ?? 1
                        });
                    }
                } else if (refund.type === Fiscal.ItemType.CANCEL) {
                    printerFiscalReceipt.ele('printRecRefundVoid', {
                        operator: refund.operation ?? 1
                    });
                }
            }
        }
        // subtotals
        if (receipt.subtotals && receipt.subtotals.length > 0) {
            for (const subtotal of receipt.subtotals) {
                if (subtotal.type === Fiscal.ItemType.HOLD) {
                    if (subtotal.operations && subtotal.operations.length > 0) {
                        for (const operation of subtotal.operations) {
                            printerFiscalReceipt.ele('printRecSubtotalAdjustment', {
                                operator: operation.operator ?? 1,
                                description: operation.description ?? '',
                                amount: operation.amount,
                                justification: operation.justification ?? 1,
                                adjustmentType: ((t: number): number => {
                                    switch (t) {
                                        case 2:
                                            return 1;
                                        case 3:
                                            return 2;
                                        case 6:
                                            return 6;
                                        case 7:
                                            return 7;
                                        default:
                                            return 1;
                                    }
                                })(operation.type)
                            });
                        }
                    }
                    printerFiscalReceipt.ele('printRecSubtotal', {
                        operator: subtotal.operator ?? 1,
                        option: subtotal.option
                    });
                } else if (subtotal.type === Fiscal.ItemType.CANCEL) {
                    if (subtotal.operations && subtotal.operations.length > 0) {
                        for (const operation of subtotal.operations) {
                            printerFiscalReceipt.ele('printRecSubtotalAdjustVoid', {
                                operator: operation.operator ?? 1
                            });
                        }
                    }
                }
            }
        }
        // lottery
        if (receipt.lottery) {
            printerFiscalReceipt.ele('printRecLotteryID', {
                operator: receipt.lottery.operator ?? 1,
                code: receipt.lottery.code
            });
        }
        // personalTaxCode
        if (receipt.personalTaxCode) { 
            printerFiscalReceipt.ele('printRecPersonalTaxId', {
                operator: receipt.personalTaxCode.operator ?? 1,
                taxCode: receipt.personalTaxCode.code || ''
            });
        }
        // payments
        if (receipt.payments && receipt.payments.length > 0) {
            for (const payment of receipt.payments) {
                printerFiscalReceipt.ele('printRecTotal', {
                    operator: payment.operator ?? 1,
                    description: payment.description ?? '',
                    payment: payment.payment ?? 0,
                    paymentType: payment.paymentType ?? 0,
                    index: payment.index ?? 1,
                    justification: payment.justification ?? 1
                });
            }
        }
        // barCode
        if (receipt.barCode) {
            printerFiscalReceipt.ele('printBarCode', {
                operator: receipt.barCode.operator ?? 1,
                position: receipt.barCode.position ?? 900,
                width: receipt.barCode.width ?? 1,
                height: receipt.barCode.height ?? 1,
                hRIPosition: receipt.barCode.hriPosition ?? 0,
                hRIFont: receipt.barCode.hriFont ?? 'A',
                codeType: receipt.barCode.type ?? 'CODE128',
                code: receipt.barCode.data ?? ''
            });
        }
        // qrCode
        if (receipt.qrCode) {
            printerFiscalReceipt.ele('printBarCode', {
                operator: receipt.qrCode.operator ?? 1,
                qRCodeAlignment: receipt.qrCode.alignment ?? 0,
                qRCodeSize: receipt.qrCode.size ?? 1,
                qRCodeErrorCorrection: receipt.qrCode.errorCorrection ?? 0,
                codeType: receipt.qrCode.type ?? 'CODE128',
                code: receipt.qrCode.data ?? ''
            });
        }
        // graphicCoupon
        if (receipt.graphicCoupon) {
            printerFiscalReceipt.ele('printGraphicCoupon', {
                operator: receipt.graphicCoupon.operator ?? 1,
                graphicFormat: receipt.graphicCoupon.format ?? 'B'
            }, receipt.graphicCoupon.value ?? '');
        }
        // end
        printerFiscalReceipt.ele('endFiscalReceipt', { operator: receipt.operator ?? 1 });
        // openDrawer
        if (receipt.openDrawer) {
            printerFiscalReceipt.ele('openDrawer', {
                operator: receipt.openDrawer.operator ?? 1
            });
        }
        return printerFiscalReceipt;
    }

    /**
     * convert `Fiscal.Report` to the object that printer server supports.
     * @param report 
     * @returns 
     */
    private convertReportToXmlDoc(report: Fiscal.Report): xmlbuilder.XMLDocument {
        const printerFiscalReport = xmlbuilder.create('printerFiscalReport');
        if (report.type === Fiscal.ReportType.DAILY_FINANCIAL_REPORT) {
            printerFiscalReport.ele('printXReport', {
                operator: report.operator ?? 1
            });
        } else if (report.type === Fiscal.ReportType.DAILY_FISCAL_CLOUSE) {
            printerFiscalReport.ele('printZReport', {
                operator: report.operator ?? 1,
                timeout: report.timeout ?? 6000
            });
        } else if (report.type === Fiscal.ReportType.ALL) {
            printerFiscalReport.ele('printXZReport', {
                operator: report.operator ?? 1,
                timeout: report.timeout ?? 12000
            });
        }
        return printerFiscalReport;
    }

    /**
     * convert `Fiscal.Cancel` to the object that printer server supports.
     * @param cancel 
     * @returns 
     */
    private convertCancelToXmlDoc(cancel: Fiscal.Cancel): xmlbuilder.XMLDocument {
        const printerFiscalReceipt = xmlbuilder.create('printerFiscalReceipt');
        printerFiscalReceipt.ele('printRecMessage', {
            operator: cancel.operator ?? 1,
            messageType: '4',
            message: `${cancel.type} ${cancel.zRepNum} ${cancel.docNum} ${cancel.date} ${cancel.fiscalNum}`
        });
        return printerFiscalReceipt;
    }

    /**
     * convert `Fiscal.NonFiscal` to the object that printer server supports.
     * @param nonFiscal 
     * @returns 
     */
    // private convertNonFiscalToXmlDoc(nonFiscal: Fiscal.NonFiscal): xmlbuilder.XMLDocument { }

    /**
     * convert `Fiscal.Invoice` to the object that printer server supports.
     * @param invoice 
     * @returns 
     */
    // private convertInvoiceToXmlDoc(invoice: Fiscal.Invoice): xmlbuilder.XMLDocument { }

    /**
     * convert `Fiscal.Command` to the object that printer server supports.
     * @param commands
     * @returns 
     */
    private convertCommandToXmlDoc(...commands: Fiscal.Command[]): xmlbuilder.XMLDocument {
        const printerCommand = xmlbuilder.create(commands.length > 1 ? 'printerCommands' : 'printerCommand');
        for (const command of commands) {
            if (EpsonXmlHttpClient.COMMAND_CODE[command.code]) {
                EpsonXmlHttpClient.COMMAND_CODE[command.code](printerCommand, command);
            }
        }
        return printerCommand;
    }

}