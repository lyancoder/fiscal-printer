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

### Interfaces

- `printFiscalReceipt(receipt: Fiscal.Receipt)`

- `printFiscalReport(report: Fiscal.Report)`

- `printCancel(cancel: Fiscal.Cancel)`

- `executeCommand(...commands: Fiscal.Command[])`

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

### Implemented
| Epson |
| --- |
| Fiscal ePOS-Print XML |
