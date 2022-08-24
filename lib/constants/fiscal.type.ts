import { AnyObj } from "./common.type"

export namespace Fiscal {

    // *********************
    // Common type
    // *********************

    // export type CommonItem = {
    //     openDrawer?: OpenDrawer,
    //     display?: Display,
    // }

    export type OpenDrawer = {
        operator?: string,
    }

    // export type Display = {
    //     clear?: boolean,
    //     operator?: string,
    //     data?: string,
    // }

    // *********************
    // Core type
    // *********************

    export type Receipt = {
        operator?: string,
        sales?: Sale[],
        lottery?: Lottery,
        refunds?: Refund[],
        subtotals?: Subtotal[],
        payments?: Payment[],
        barCode?: BarCode,
        qrCode?: QrCode,
        graphicCoupon?: GraphicCoupon,
        openDrawer?: OpenDrawer,
        personalTaxCode?: PersonTaxCode
    }

    export type Report = {
        type: ReportType,
        operator?: string,
        timeout?: number,
        openDrawer?: OpenDrawer,
    }

    export type Cancel = {
        type: CancelType,
        zRepNum: string,
        docNum: string,
        date: string,
        fiscalNum: string,
        operator?: string,
    }

    // export type NonFiscal = {
    //     operator?: string,
    //     normal?: Normal,
    //     barCode?: BarCode,
    //     qrCode?: QrCode,
    //     graphicCoupon?: GraphicCoupon,
    // }

    // export type Invoice = {
    //     operator?: string,
    //     docType?: string,
    //     docNum?: string,
    // } | Receipt

    export type Command = {
        code: CommandCode,
        data?: AnyObj,
    }

    // *********************
    // Sub type
    // *********************

    export type Sale = {
        type: ItemType,
        operations?: Operation[],
        operator?: string,
        description?: string,
        quantity: number,
        unitPrice: number,
        department?: string,
        justification?: string,
    }

    export type Lottery = {
        code: string,
        operator?: string,
    }

    export type Refund = {
        type: ItemType,
        optType?: string,
        operation?: Operation,
        operator?: string,
        quantity?: number,
        unitPrice?: number,
        amount?: number,
        description?: string,
        department?: string,
        justification?: string,
    }

    export type Subtotal = {
        type: ItemType,
        option?: SubtotalOpt,
        operations?: Operation[],
        operator?: string,
    }

    export type Payment = {
        paymentType?: PaymentType,
        index?: string,
        operator?: string,
        description?: string,
        payment?: number,
        justification?: string,
    }

    export type Operation = {
        type: OperationType,
        operator?: string,
        amount: number,
        description?: string,
        department?: string,
        justification?: string,
    }

    // export type Message = {
    //     type: MessageType,
    //     index?: string,
    //     data?: string,
    //     operator?: string,
    // }

    // export type Normal = {
    //     font?: string,
    //     data?: string,
    //     operator?: string,
    // }

    export type GraphicCoupon = {
        format?: string,
        value?: string,
        operator?: string,
    }

    export type PersonTaxCode = {
        code?: string;
        operator?: string;
    }

    // export type Logo = {
    //     location?: string,
    //     index?: string,
    //     option?: string,
    //     format?: string,
    //     value?: string,
    //     operator?: string,
    // }

    export type BarCode = {
        position?: string,
        width?: number,
        height?: number,
        hriPosition?: string,
        hriFont?: string,
        type?: string,
        data: string,
        operator?: string,
    }

    export type QrCode = {
        alignment?: string,
        size?: number,
        errorCorrection?: number,
        type?: string,
        data: string,
        operator?: string,
    }

    // *********************
    // Enum
    // *********************

    export enum ItemType {
        HOLD,
        CANCEL
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

    // export enum MessageType {
    //     ADDITIONAL_HEADER,
    //     TRAILER,
    //     ADDITIONAL_TRAILER,
    //     ADDITIONAL_DESC,
    //     CUSTOMER_ID,
    //     PRINT_EFTPOS_TRANS_LINE,
    //     ERASE_EFTPOS_TRANS_LINE,
    // }

    export enum OperationType {
        DISCOUNT_SALE,
        DISCOUNT_DEPARTMENT,
        DISCOUNT_SUBTOTAL_PRINT,
        DISCOUNT_SUBTOTAL_NOT_PRINT,
        SURCHARGE_SALE,
        SURCHARGE_DEPARTMENT,
        SURCHARGE_SUBTOTAL_PRINT,
        SURCHARGE_SUBTOTAL_NOT_PRINT,
        DEPOSIT,
        FREE_OF_CHARGE,
        SINGLE_USE_VOUCHER,
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
        // AUTHORIZESALES,
        // BEGIN_TRAINING,
        // EFTPOS_DAILY_CLOSURE,
        // EFTPOS_GET_CURRENT_TOTAL,
        // END_TRAINING,
        // GET_DATE,
        // PRINT_CONTENT_BY_DATE,
        // PRINT_CONTENT_BY_NUMBERS,
        // PRINT_DUPLICATE_RECEIPT,
        // PRINT_REC_CASH,
        // PRINT_REC_VOID,
        // QUERY_CONTENT_BY_DATE,
        // QUERY_CONTENT_BY_NUMBERS,
        QUERY_PRINTER_STATUS,
        REBOOT_WEB_SERVER,
        RESET_PRINTER,
        // SET_DATE,
        // SET_LOGO,
        GET_NATIVE_CODE_FUNCTION
    }
}