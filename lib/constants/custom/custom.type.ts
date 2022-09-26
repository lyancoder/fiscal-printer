import { AnyObj } from "../common.type"

export namespace CustomProtocol {

    // *********************
    // Common type
    // *********************

    export type OpenDrawer = {
        operator?: string,
    }

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

    export type Command = {
        code: CommandCode,
        data?: AnyObj,
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

    export type Refund = {
        type: ItemType,
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
        format?: string,
        value?: string,
        operator?: string,
    }

    export type PersonTaxCode = {
        code?: string;
        operator?: string;
    }

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