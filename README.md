## Fiscal Printer
In order to easily interface with different brands of fiscal printers and use their same functions, this module defines a unified interactive data structure and interfaces. By implementing these interfaces to interact with a certain certain brand of fiscal printer.

### Interactive data structure

#### Fiscal.Receipt

| Name | Desc |
| --- | --- |
| operator | to identify the operator |
| sales | sale items or cancel sale items |
| lottery | national lottery unique customer code |
| personalTaxCode | 
| refunds | refund items or cancel refunds |
| subtotals |  |
| payments |  |
| barCode |  |
| qrCode |  |
| graphicCoupon |  |
| openDrawer |  |

#### Fiscal.Report

| Name | Desc |
| --- | --- |
| type | report type: daily financial report or daily fiscal closure or both |
| operator |  |
| timeout |  |
| openDrawer |  |

#### Fiscal.Cancel

| Name | Desc |
| --- | --- |
| type | void or redund |
| zRepNum | daily fiscal closure report number |
| docNum |  document number |
| date |  |
| fiscalNum | fiscal serial number of the printer |
| operator |  |

#### Fiscal.Command

| Name | Desc |
| --- | --- |
| code | command type |
| data | data required by the command |

#### Commands

| Command | Desc | Support
| --- | --- | --- |
| OPEN_DRAWER | value: 0, open drawer | Epson / Custom |
| QUERY_PRINTER_STATUS | value 1, query printer status | Epson / Custom |
| RESET_PRINTER | value 2, reset printer | Epson / Custom |
| GET_NATIVE_CODE_FUNCTION | value 3, use printer native code command | Epson / Custom |
| GET_INFO | value 4, get printer device info | Custom Only |


### Interfaces
| Epson | Custom |
| --- | --- |
| `printFiscalReceipt(receipt: Fiscal.Receipt)` | `printFiscalReceipt(receipt: FPrinterCustom.Receipt)` |
| `printFiscalReport(report: Fiscal.Report)` | `printFiscalReport(report: FPrinterCustom.Report)` |
| `printCancel(cancel: Fiscal.Cancel)` | `printCancel(cancel: FPrinterCustom.Cancel)` |
| `executeCommand(...commands: Fiscal.Command[])` | `executeCommand(...commands: FPrinterCustom.Command[])` |

### Usage

- Epson Fiscal ePOS-Print XML Examples

```typescript
// Create a client
const fprinter: FPrinter.Client = new EpsonXmlHttpClient({
    host: '192.168.1.1',
    deviceId: 'local_printer',
    timeout: 10000
});

// Fiscal receipt
await client.printFiscalReceipt({
    sales: [
        {
            type: Fiscal.ItemType.HOLD,
            description: 'A',
            quantity: 1,
            unitPrice: 5
        },
        {
            type: Fiscal.ItemType.HOLD,
            description: 'B',
            quantity: 2,
            unitPrice: 2.5
        },
        {
            type: Fiscal.ItemType.HOLD,
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

// Fiscal Report
await client.printFiscalReport({
    type: Fiscal.ReportType.DAILY_FISCAL_CLOUSE,
});
```

- Custom Protocol Examples 
- `Note: unit quantity multiplied by 1000, unit price multiplied by 1000, include the discount, payment`

```typescript
// Create a client
const fprinter: FPrinterCustom.Client = new CustomXmlHttpClient({
    host: '192.168.1.1',
    fiscalId: 'STMTE500432', // 11 digits
});

// Fiscal receipt
await fprinter.printFiscalReceipt({
    sales: [
        {
            type: Fiscal.ItemType.HOLD,
            description: 'A',
            quantity: 1 * 1000,
            unitPrice: 5 * 100
        },
        {
            type: Fiscal.ItemType.HOLD,
            description: 'B',
            quantity: 2 * 1000,
            unitPrice: 2.5 * 100
        },
        {
            type: Fiscal.ItemType.HOLD,
            description: 'C',
            quantity: 3 * 1000,
            unitPrice: 3 * 100
        },
    ],
    payments: [
        {
            description: 'Payment in cash',
            payment: 19 * 100,
            paymentType: 1
        }
    ]
});

// Fiscal Refund
// step 1 request to make sure the annulment is possible, if responseBuf === 1 then execute step 2 
await fprinter.printCancel({
    docRefZ: '0021',
    docRefNumber: '0034',
    docDate: '011022', // DDMMYY
    printPreview: CustomProtocol.EnableType.DISABLE,
    fiscalSerial: 'STMTE500432',
    checkOnly: CustomProtocol.EnableType.ABLE, 
    codLottery: 'ASDSFES7',
});

// step 2 to proceed with the actual void request
await fprinter.printCancel({
    docRefZ: '0021',
    docRefNumber: '0034',
    docDate: '011022', // DDMMYY,
    printPreview: CustomProtocol.EnableType.DISABLE,
    fiscalSerial: 'STMTE500432',
    checkOnly: CustomProtocol.EnableType.DISABLE,
    codLottery: 'ASDSFES7',
});

// Fiscal Report
await fprinter.printFiscalReport({
    type: CustomProtocol.ReportType.DAILY_FISCAL_CLOUSE,
});

// Fiscal Command
await fprinter.executeCommand({
    code: CustomProtocol.CommandCode.OPEN_DRAWER
});
```

### Implemented
| Epson | Custom | RCH
| --- | --- | --- |
| Fiscal ePOS-Print XML | | | 
