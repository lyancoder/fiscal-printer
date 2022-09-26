import axios from "axios";
import * as xmlbuilder from 'xmlbuilder';
import { Parser } from 'xml2js';
import { FPrinterCustom } from "../../constants/custom/fprinter.custom";
import { CustomProtocol } from "../../constants/custom/custom.type";

export class CustomXmlHttpClient extends FPrinterCustom.Client {

    private static XML_RESPONSE = 'response';
    private static INFO_XML_RESPONSE = 'infoResp';
    
    private static COMMAND_CODE = {
        [CustomProtocol.CommandCode.OPEN_DRAWER]: (printerCommand: xmlbuilder.XMLElement, command: CustomProtocol.Command) => {
            printerCommand.ele('openDrawer');
        }, 
        [CustomProtocol.CommandCode.QUERY_PRINTER_STATUS]: (printerCommand: xmlbuilder.XMLElement, command: CustomProtocol.Command) => {
            printerCommand.ele('queryPrinterStatus');
        },  
        [CustomProtocol.CommandCode.RESET_PRINTER]: (printerCommand: xmlbuilder.XMLElement, command: CustomProtocol.Command) => {
            printerCommand.ele('resetPrinter', {
                operator: command.data?.operator ?? 1
            });
        }, 
        [CustomProtocol.CommandCode.GET_NATIVE_CODE_FUNCTION]: (printerCommand: xmlbuilder.XMLElement, command: CustomProtocol.Command) => {
            printerCommand.ele('directIO', {
                command: command.data?.command ?? '0000',
                data: command.data?.operator ?? '01',
            });
        }, 
        [CustomProtocol.CommandCode.GET_INFO]: (printerCommand: xmlbuilder.XMLElement, command: CustomProtocol.Command) => {
            printerCommand.ele('getInfo');
        }
    }

    /**
     * commercial document
     * @param receipt 
     */
    async printFiscalReceipt(receipt: CustomProtocol.Receipt): Promise<FPrinterCustom.Response> {
        const xmlDoc = this.convertReceiptToXmlDoc(receipt);
        return this.send(xmlDoc);
    }

    /**
     * daily closure (X and Z reports)
     * @param report 
     */
    async printFiscalReport(report: CustomProtocol.Report): Promise<FPrinterCustom.Response> {
        const xmlDoc = this.convertReportToXmlDoc(report);
        return this.send(xmlDoc);
    }

    /**
     * print a commercial refund/void document
     * @param cancel 
     */
    async printCancel(cancel: CustomProtocol.Cancel): Promise<FPrinterCustom.Response> {
        const xmlDoc = this.convertCancelToXmlDoc(cancel);
        return this.send(xmlDoc);
    }

    /**
     * send Command to fiscal printer
     * @param commands 
     */
    async executeCommand(...commands: CustomProtocol.Command[]): Promise<FPrinterCustom.Response> {
        const xmlDoc = this.convertCommandToXmlDoc(...commands);
        const isGetInfo = !!commands.length && (commands[0].code === CustomProtocol.CommandCode.GET_INFO);
        return this.send(xmlDoc, isGetInfo);
    }

    // *********************
    // Emitter
    // *********************

    /**
     * send to the printer server
     * @param xmlDoc
     * @returns 
     */
    private async send(xmlDoc: xmlbuilder.XMLDocument, isGetInfo?: boolean): Promise<FPrinterCustom.Response> {
        // build the printer server url based on config
        const config = this.getConfig();
        let url = `http://${config.host}/xml/printer.htm`;
        // build xml string
        const xmlStr = this.parseRequest(xmlDoc);
        const headers: {
            'Content-Type': string;
            authorization?: string;
        } = {
            'Content-Type': 'text/plain'
        };
        config.fiscalId && (headers.authorization = `Basic ${Buffer.from(`${config.fiscalId}:${config.fiscalId}`).toString('base64')}`);
        // send
        const resXmlStr: string = await new Promise((resolve, reject) => {
            axios
                .post(url, xmlStr, {
                    headers
                })
                .then((res) => {
                    resolve(res.data);
                })
                .catch((err) => {
                    reject(err);
                });
        });
        const response = await this.parseResponse(resXmlStr, isGetInfo);
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
     * <printerCommand>
     *  <queryPrinterStatus></queryPrinterStatus>
     * </printerCommand>
     * @param xmlDoc
     * @returns 
     */
    private parseRequest(xmlDoc: xmlbuilder.XMLDocument): string {
        // const reqXmlStr = xmlbuilder
        //     .create(CustomXmlHttpClient.XML_ROOT, { version: '1.0', encoding: 'utf-8', standalone: true })
        //     .ele(CustomXmlHttpClient.XML_BODY)
        //     .importDocument(xmlDoc)
        //     .end({ pretty: true });
        const reqXmlStr = xmlDoc.end({ pretty: true });
        return reqXmlStr;
    }

    /**
     * Response Message Format:
     * <?xml version="1.0" encoding="utf-8"?>
     *   <response success="" status=""> success : "true" | "false";  status: if error "error code" else 0;
     *      <addInfo>
     *          ...
     *      </addInfo>
     *   </response>
     * @param xmlStr 
     */
    private async parseResponse(xmlStr: string, isGetInfo?: boolean): Promise<FPrinterCustom.Response> {
        // create xml parser
        let response;
        // explicitArray: Always put child nodes in an array if true; otherwise an array is created only if there is more than one.
        // mergeAttrs: Merge attributes and child elements as properties of the parent, instead of keying attributes off a child attribute object.
        const parser = new Parser({ explicitArray: false, mergeAttrs: true });
        // parse to object
        const xmlObj = await parser.parseStringPromise(xmlStr);
        if (xmlObj && Object.keys(xmlObj).length) {
            // get response data
            response = xmlObj[isGetInfo ? CustomXmlHttpClient.INFO_XML_RESPONSE : CustomXmlHttpClient.XML_RESPONSE];
        }
        return {
            ok: !!response && response.success === 'true',
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
    private convertReceiptToXmlDoc(receipt: CustomProtocol.Receipt): xmlbuilder.XMLDocument {
        // init
        const printerFiscalReceipt = xmlbuilder.create('printerFiscalReceipt');
        // begin
        printerFiscalReceipt.ele('beginFiscalReceipt');
        // lottery
        if (receipt.lottery) {
            printerFiscalReceipt.ele('setLotteryCode', {
                code: receipt.lottery.code
            });
        }
        // sales
        if (receipt.sales && receipt.sales.length > 0) {
            for (const sale of receipt.sales) {
                const commonSale: CustomProtocol.CommonSale = {
                    description: sale.description || '',
                    quantity: sale.quantity,
                    unitPrice: sale.unitPrice,
                    department: sale.department ?? 1,
                }
                sale.idVat !== void 0 && (commonSale.idVat = sale.idVat ?? 17);
                // sale or return
                if (sale.type === CustomProtocol.ItemType.HOLD) {
                    // item
                    printerFiscalReceipt.ele('printRecItem', commonSale);
                    // item adjustment
                    if (sale.operations && sale.operations.length > 0) {
                        for (const operation of sale.operations) {
                            const recItemAdjustment: CustomProtocol.Operation = {
                                description: operation.description ?? '',
                                department: operation.department ?? 1,
                                amount: operation.amount,
                                // only values 2 or 3 are allowed
                                adjustmentType: [2, 3].includes(operation.adjustmentType) ? operation.adjustmentType : 3,
                            }
                            operation.idVat !== void 0 && (recItemAdjustment.idVat = operation.idVat ?? 17);
                            printerFiscalReceipt.ele('printRecItemAdjustment', recItemAdjustment);
                        }
                    }
                } else if (sale.type === CustomProtocol.ItemType.CANCEL) {
                    // void item
                    printerFiscalReceipt.ele('printRecItemVoid', commonSale);
                    // void item adjustment
                    // if (sale.operations && sale.operations.length > 0) {
                    //     for (const operation of sale.operations) {
                    //         printerFiscalReceipt.ele('printRecItemAdjustmentVoid');
                    //     }
                    // }
                }
            }
        }
        // refunds
        if (receipt.refunds && receipt.refunds.length > 0) {
            for (const refund of receipt.refunds) {
                if (refund.type === CustomProtocol.ItemType.HOLD) {
                    const recRefund: CustomProtocol.CommonSale = {
                        description: refund.description || '',
                        quantity: refund.quantity ?? 1,
                        unitPrice: refund.unitPrice ?? 0,
                        department: refund.department ?? 1,
                    }
                    refund.idVat !== void 0 && (recRefund.idVat = refund.idVat ?? 17);
                    printerFiscalReceipt.ele('printRecRefund', recRefund);
                } else if (refund.type === CustomProtocol.ItemType.CANCEL) {
                    printerFiscalReceipt.ele('printRecRefundVoid');
                }
            }
        }
        // subtotals
        if (receipt.subtotals && receipt.subtotals.length > 0) {
            for (const subtotal of receipt.subtotals) {
                if (subtotal.type === CustomProtocol.ItemType.HOLD) {
                    if (subtotal.operations && subtotal.operations.length > 0) {
                        for (const operation of subtotal.operations) {
                            const recSubtotalAdjustment: CustomProtocol.Operation = {
                                description: operation.description || '',
                                amount: operation.amount,
                                adjustmentType: [2, 3].includes(operation.adjustmentType) ? operation.adjustmentType : 3
                            };
                            operation.idVat !== void 0 && (recSubtotalAdjustment.idVat = operation.idVat ?? 17);
                            printerFiscalReceipt.ele('printRecSubtotalAdjustment', recSubtotalAdjustment);
                        }
                    }
                    printerFiscalReceipt.ele('printRecSubtotal');
                } else if (subtotal.type === CustomProtocol.ItemType.CANCEL) {
                    if (subtotal.operations && subtotal.operations.length > 0) {
                        for (const operation of subtotal.operations) {
                            printerFiscalReceipt.ele('printRecSubtotalAdjustVoid');
                        }
                    }
                }
            }
        }
        // payments
        if (receipt.payments && receipt.payments.length > 0) {
            for (const payment of receipt.payments) {
                printerFiscalReceipt.ele('printRecTotal', {
                    description: payment.description ?? '',
                    payment: payment.payment ?? 0,
                    paymentType: payment.paymentType ?? 0,
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
        printerFiscalReceipt.ele('endFiscalReceiptCut');
        return printerFiscalReceipt;
    }

    /**
     * convert `Fiscal.Report` to the object that printer server supports.
     * @param report 
     * @returns 
     */
    private convertReportToXmlDoc(report: CustomProtocol.Report): xmlbuilder.XMLDocument {
        const printerFiscalReport = xmlbuilder.create('printerFiscalReport');
        if (report.type === CustomProtocol.ReportType.DAILY_FINANCIAL_REPORT) {
            printerFiscalReport.ele('printXReport', {
                operator: report.operator ?? 1
            });
        } else if (report.type === CustomProtocol.ReportType.DAILY_FISCAL_CLOUSE) {
            printerFiscalReport.ele('printZReport', {
                operator: report.operator ?? 1,
                timeout: report.timeout ?? 6000
            });
        } else if (report.type === CustomProtocol.ReportType.ALL) {
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
    private convertCancelToXmlDoc(cancel: CustomProtocol.Cancel): xmlbuilder.XMLDocument {
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
    private convertCommandToXmlDoc(...commands: CustomProtocol.Command[]): xmlbuilder.XMLDocument {
        const printerCommand = xmlbuilder.create(commands.length > 1 ? 'printerCommands' : 'printerCommand');
        for (const command of commands) {
            if (CustomXmlHttpClient.COMMAND_CODE[command.code]) {
                CustomXmlHttpClient.COMMAND_CODE[command.code](printerCommand, command);
            }
        }
        return printerCommand;
    }

}