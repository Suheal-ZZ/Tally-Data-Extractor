// Each entry has:
//   name       - used as the output filename
//   tdlType    - Tally's internal object type name
//   fields     - list of fields to FETCH from that object
//   notes      - what this collection contains (for your reference)


const ACCOUNTING_MASTERS = [
  {
    name:    'groups',
    tdlType: 'Group',
    fields:  ['Name', 'Parent', 'PrimaryGroup', 'GUID',
              'IsRevenue', 'IsDeemed', 'AffectsGross', 'IsBillwiseon',
              'IsIntereston', 'IsCostCentreon', 'IsAddable', 'NatureGroup'],
    notes:   'Chart of accounts hierarchy',
  },
  {
    name:    'ledgers',
    tdlType: 'Ledger',
    fields:  ['Name', 'Parent', 'GUID', 'OpeningBalance',
              'CurrencyName', 'MasterId', 'IsBillwiseon',
              'CreditPeriod', 'BillCreditPeriod',
              'GSTRegistrationType', 'GSTINForDAX',
              'PAN_IT_No', 'Pincode', 'Country', 'CountryName',
              'State', 'Address', 'LedFaxNo', 'LedPhone',
              'Email', 'Website',
              'IsTDSApplicable', 'TDSNatureOfPayment',
              'LedgerPhone', 'LedgerMobile',
              'BankAccountNumber', 'BankIFSCCode', 'BankBranchName',
              'ClosingBalance'],
    notes:   'All ledger accounts with address, GST, bank details',
  },
];

// Inventory masters data

const INVENTORY_MASTERS = [
  {
    name:    'stock_groups',
    tdlType: 'StockGroup',
    fields:  ['Name', 'Parent', 'GUID', 'IsAddable'],
    notes:   'Stock item group hierarchy',
  },
  {
    name:    'stock_categories',
    tdlType: 'StockCategory',
    fields:  ['Name', 'Parent', 'GUID'],
    notes:   'Stock categories',
  },
  {
    name:    'stock_items',
    tdlType: 'StockItem',
    fields:  ['Name', 'Parent', 'Category', 'GUID',
              'BaseUnits', 'AdditionalUnits', 'Conversion',
              'OpeningBalance', 'OpeningRate', 'OpeningValue',
              'ClosingBalance', 'ClosingRate', 'ClosingValue',
              'GSTApplicable', 'TaxabilityType',
              'HSNCode', 'HSN_SACCode', 'GSTNatureOfGoods',
              'Description', 'AlterID'],
    notes:   'Products/items with HSN, GST, opening/closing stock',
  },
  {
    name:    'units_of_measure',
    tdlType: 'Unit',
    fields:  ['Name', 'GUID', 'IsSIMPLE', 'IsGSTExclude',
              'BaseUnits', 'AdditionalUnits', 'Conversion', 'Denominator'],
    notes:   'UOMs — simple and compound',
  },
  {
    name:    'godowns',
    tdlType: 'Godown',
    fields:  ['Name', 'Parent', 'GUID', 'Address', 'IsExternal', 'IsInternal'],
    notes:   'Warehouse / store locations',
  },
];

// Accounting config masters data

const CONFIG_MASTERS = [
  {
    name:    'voucher_types',
    tdlType: 'VoucherType',
    fields:  ['Name', 'Parent', 'GUID', 'NumberingMethod',
              'IsDeemedPositive', 'InAlterAMPeriod', 'IsOptional',
              'CommonNarration', 'MultipleNarration',
              'UseForPoSInvoice', 'UseForJobWorkIn', 'UseForJobWorkOut'],
    notes:   'Standard + custom voucher types and their config',
  },
  {
    name:    'currencies',
    tdlType: 'Currency',
    fields:  ['Name', 'GUID', 'MSTISOCode', 'ExpandedSymbol',
              'DecimalSymbol', 'InMillions', 'StandardSymbol'],
    notes:   'Multi-currency setup',
  },
  {
    name:    'cost_categories',
    tdlType: 'CostCategory',
    fields:  ['Name', 'GUID', 'IsRevenue', 'IsNett'],
    notes:   'Cost category hierarchy (if cost centres enabled)',
  },
  {
    name:    'cost_centres',
    tdlType: 'CostCentre',
    fields:  ['Name', 'Parent', 'Category', 'GUID',
              'IsRevenue', 'RevenueledgersForOpbal'],
    notes:   'Cost centres — projects, departments, branches',
  },
  {
    name:    'budgets',
    tdlType: 'Budget',
    fields:  ['Name', 'Parent', 'GUID', 'StartingFrom', 'PeriodLength'],
    notes:   'Budget definitions',
  },
  // {
  //   name:    'price_levels',
  //   tdlType: 'PriceLevel',
  //   fields:  ['Name', 'GUID'],
  //   notes:   'Price level / price list names',
  // },
];

// Payroll masters

const PAYROLL_MASTERS = [
  // {
  //   name:    'payroll_employee_groups',
  //   tdlType: 'EmployeeGroup',
  //   fields:  ['Name', 'Parent', 'GUID', 'PayrollCategory'],
  //   notes:   'Employee group hierarchy',
  // },
  // {
  //   name:    'payroll_employees',
  //   tdlType: 'Employee',
  //   fields:  ['Name', 'Parent', 'GUID',
  //             'EmployeeNumber', 'DateOfJoining', 'DateOfRelieving',
  //             'DateOfBirth', 'Gender', 'BloodGroup',
  //             'PAN_IT_No', 'PFAccountNumber', 'ESINumber',
  //             'UAN_Number', 'AadhaarNumber',
  //             'BankAccountNumber', 'BankIFSCCode',
  //             'Address', 'Pincode', 'Mobile', 'Email',
  //             'Designation', 'Department', 'Location',
  //             'PayrollCategory', 'PayStructure'],
  //   notes:   'Employee master — PAN, PF, ESI, UAN, bank, address',
  // },
  // {
  //   name:    'payroll_pay_heads',
  //   tdlType: 'PayHead',
  //   fields:  ['Name', 'Parent', 'GUID',
  //             'PayHeadType', 'IncomeType', 'CalculationType',
  //             'CalcPeriod', 'LimitPeriod', 'LimitType',
  //             'IsTDSApplicable', 'IsExempt',
  //             'AffectsNetSalary', 'IsProrated'],
  //   notes:   'Pay heads — basic, HRA, PF, ESI, TDS, deductions',
  // },
  // {
  //   name:    'payroll_attendance_types',
  //   tdlType: 'AttendanceType',
  //   fields:  ['Name', 'Parent', 'GUID', 'AttendanceType'],
  //   notes:   'Attendance/production type definitions',
  // },
];

//// GST Masters Data
const GST_MASTERS = [
  {
    name:    'gst_classifications',
    tdlType: 'GSTClassification',
    fields:  ['Name', 'GUID', 'GSTNatureOfGoods', 'HSN_SACCode',
              'GSTNatureOfTransaction', 'GSTTypesOfSupply'],
    notes:   'GST classification / HSN master',
  },
];

/// Vocher Information
const VOUCHER_TYPES = [
  'Sales',
  'Purchase',
  'Receipt',
  'Payment',
  'Journal',
  'Contra',
  'Debit Note',
  'Credit Note',
  'Stock Journal',    
  'Delivery Note',      
  'Receipt Note',      
  'Rejection In',
  'Rejection Out',
  'Memorandum',
  'Physical Stock',
];

// Payroll voucher types extracted separately (they need SVFROMDATE/SVTODATE too)
const PAYROLL_VOUCHER_TYPES = [
  'Payroll',
  'Attendance',
];

// Financial Reports (built-in Tally reports) ───────────────────────────────

// These are fetched once using the report name, not as collections
const FINANCIAL_REPORTS = [
  { name: 'trial_balance',     reportId: 'Trial Balance'  },
  { name: 'balance_sheet',     reportId: 'Balance Sheet'  },
  { name: 'stock_summary',     reportId: 'Stock Summary'  },
  { name: 'cash_flow',         reportId: 'Cash Flow'      },
];

const FINANCIAL_REPORT_PL = [
    { name: 'profit_loss',       reportId: 'Profit & Loss'  },
]

module.exports = {
  ACCOUNTING_MASTERS,
  INVENTORY_MASTERS,
  CONFIG_MASTERS,
  PAYROLL_MASTERS,
  GST_MASTERS,
  VOUCHER_TYPES,
  PAYROLL_VOUCHER_TYPES,
  FINANCIAL_REPORTS,
  FINANCIAL_REPORT_PL
};
