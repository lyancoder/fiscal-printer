import { AnyObj } from "../common.type"

export namespace CustomProtocol {

    // *********************
    // Common type
    // *********************

    export type OpenDrawer = {
        operator?: string;
    }

    // *********************
    // Core type
    // *********************

    export type Receipt = {
        operator?: string;
        sales?: Sale[];
        lottery?: Lottery;
        refunds?: Refund[];
        subtotals?: Subtotal[];
        payments?: Payment[];
        barCode?: BarCode;
        qrCode?: QrCode;
        graphicCoupon?: GraphicCoupon;
        openDrawer?: OpenDrawer;
        // customer ID
        personalTaxCode?: Message;
        beginDisplayText?: DisplayText;
        endDisplayText?: DisplayText;
    }

    export type Report = {
        type: ReportType;
        operator?: string;
        timeout?: number;
        openDrawer?: OpenDrawer;
    }

    export type Cancel = {
        docRefZ: string;
        docRefNumber: string;
        docDate: string;
        printPreview?: EnableType;
        fiscalSerial?: string;
        checkOnly?: EnableType;
        codLottery: string;
        cancelRecItems?: CommonSale[];
    }

    export type Command = {
        code: CommandCode;
        data?: AnyObj;
    }

    // *********************
    // Sub type
    // *********************

    export type Sale = {
        type: ItemType;
        operations?: Operation[];
    } & CommonSale;

    export type CommonSale = {
        description?: string;
        quantity: number;
        unitPrice: number;
        department?: number;
        idVat?: number;
    }

    export type Lottery = {
        code: string;
    }

    export type Message = {
        /**
         * Line of text to be printed (maximum 42 characters).
         * The maximum lengths are set based on the "font" attribute.
         * Additional characters are truncated.
         */
        message: string;
        /**
         * Type of line to print:
         * 
         * 1 = additional descriptive line (sales body)
         * 2 = additional line in payments
         * 3 = line issued after payment
         * 4 = courtesy line
        */
        messageType: string;
        /**
         * Font type:
         * 1 = normal
         * 2 = bold
         * 3 = 42 characters long
         * 4 = double height
         * 5 = double width
         * 6 = italics
         * 7 = length 42, double height
         * 8 = length 42, bold
         * 9 = length 42, bold, double height
         * C = normal, used for printing the customer in the tax invoice
         * P = normal, used to print the return receipt number in a credit note
         * B = normal, used for printing the customer ID (Scontrino Parlante)
         */
        font: string;
    }

    export type DisplayText = {
        data: string;
    }

    export type Refund = {
        type: ItemType;
    } & CommonSale;

    export type Subtotal = {
        type: ItemType;
        operations?: Operation[];
    }

    export type Payment = {
        paymentType?: PaymentType;
        description?: string;
        payment?: number;
        paymentQty?: number;
    }

    export type Operation = {
        adjustmentType: AdjustmentType;
        amount: number;
        description?: string;
        department?: number;
        idVat?: number;
        quantity?: number;
    }

    export type GraphicCoupon = {
        format?: string;
        value?: string;
        operator?: string;
    }

    export type PersonTaxCode = {
        code: string;
    }

    export type BarCode = {
        position?: string;
        width?: number;
        height?: number;
        hriPosition?: string;
        hriFont?: string;
        type?: string;
        data: string;
        operator?: string;
    }

    export type QrCode = {
        alignment?: string;
        size?: number;
        errorCorrection?: number;
        type?: string;
        data: string;
        operator?: string;
    }

    // *********************
    // Enum
    // *********************

    export enum ItemType {
        HOLD,
        CANCEL
    }

    export enum EnableType {
        DISABLE,   
        ABLE
    }

    export enum ReportType {
        DAILY_FINANCIAL_REPORT,
        DAILY_FISCAL_CLOUSE,
        ALL,
    }

    export enum CancelType {
        REFUND = 'REFUND',
        VOID = 'VOID'
    }

    export enum AdjustmentType { 
        SURCHARGE_DEPARTMENT = 2,
        DISCOUNT_DEPARTMENT = 3,
    }

    export enum SubtotalOpt {
        PRINT_DISPLAY,
        PRINT,
        DISPLAY,
    }

    export enum PaymentType {
        CASH,
        CHEQUE,
        CREDIT_OR_CREDIT_CARD,
        TICKET,
        MULTI_TICKET,
        NOT_PAID,
        PAYMENT_DISCOUNT,
    }

    export enum CommandCode {
        OPEN_DRAWER,
        QUERY_PRINTER_STATUS,
        RESET_PRINTER,
        GET_NATIVE_CODE_FUNCTION,
        GET_INFO
    }
}