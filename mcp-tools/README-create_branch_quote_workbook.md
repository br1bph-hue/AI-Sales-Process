# `create_branch_quote_workbook` MCP Tool

## Overview

This tool generates standardized Excel workbooks for sales quotes in a wholesale distribution business. It is designed to be called from Claude Desktop, Claude Code, or any MCP-compatible client.

## Tool Behavior

### Core Principle: Data In, Fixed Structure Out

The tool **never modifies** the workbook template structure. It only:
1. Inserts data values into predefined cells
2. Relies on pre-built Excel formulas for all calculations

This ensures every quote workbook is consistent, auditable, and compatible with downstream systems (ERP imports, reporting, etc.).

---

## Workbook Structure

### Sheet 1: `Quote_Header`

| Column | Field | Source |
|--------|-------|--------|
| A | Quote_ID | Input |
| B | Branch_Code | Input |
| C | Customer_Name | Input |
| D | Customer_Contact | Input |
| E | Job_Name | Input |
| F | Job_Address | Input |
| G | Sales_Rep | Input |
| H | Quote_Date | Input |
| I | Expiration_Date | Input |
| J | Payment_Terms | Input (default: "Net 30") |

Data is inserted into row 2 (row 1 contains headers).

---

### Sheet 2: `Quote_Lines`

| Column | Field | Source/Formula |
|--------|-------|----------------|
| A | Line_No | Auto-generated (1, 2, 3...) |
| B | SKU | Input |
| C | Description | Input |
| D | UOM | Input |
| E | Quantity | Input |
| F | List_Price | Input |
| G | Cost | Input |
| H | Discount_Percent | Input (default: 0) |
| I | Sell_Price | **Formula:** `=F{row}*(1-H{row})` |
| J | Extended_Price | **Formula:** `=E{row}*I{row}` |
| K | Margin_Dollars | **Formula:** `=J{row}-(E{row}*G{row})` |
| L | Margin_Percent | **Formula:** `=IF(J{row}=0,0,K{row}/J{row})` |

- Data starts at row 2 (row 1 contains headers)
- Formulas are applied to each row dynamically
- Cost and Margin columns may be hidden or protected in customer-facing versions

---

### Sheet 3: `Summary`

| Row | Field | Source/Formula |
|-----|-------|----------------|
| 2 | Subtotal_Material | **Formula:** `=SUM(Quote_Lines!J:J)` |
| 3 | Freight_Charge | Input |
| 4 | Tax_Amount | Input |
| 5 | Grand_Total | **Formula:** `=B2+B3+B4` |
| 6 | Overall_Margin_Percent | **Formula:** `=IF(B2=0,0,SUM(Quote_Lines!K:K)/B2)` |

---

## Implementation Requirements

### 1. File Generation

- **Library:** Use `openpyxl` (Python) or `ExcelJS` (Node.js) or equivalent
- **Output format:** `.xlsx` (Office Open XML)
- **File naming:** `Quote_{quote_id}_{branch_code}.xlsx`
- **Storage:** Save to configured output directory, return both local path and download URL

### 2. Formula Handling

```
CRITICAL: Formulas must be written as Excel formulas, not computed values.
```

This allows users to:
- Modify quantities and see prices update
- Audit calculation logic
- Trust that the workbook matches the standard template

### 3. Data Validation

Before generating:
- Validate all required fields are present
- Validate `branch_code` is in the allowed enum
- Validate `discount_percent` is between 0 and 1
- Validate `quantity`, `list_price`, `cost` are non-negative
- Validate at least one line item exists

### 4. Number Formatting

Apply appropriate Excel number formats:
- Currency fields (prices, costs, totals): `$#,##0.00`
- Percentages (discount, margin): `0.00%`
- Quantities: `#,##0.00` or `#,##0` depending on UOM

### 5. Error Handling

Return structured errors for:
- Missing required fields
- Invalid enum values
- Invalid data types
- File system errors

---

## Assumptions

1. **Single quote per workbook** — Each call creates a new file
2. **No template file required** — The tool builds the structure programmatically
3. **Branch codes are static** — Enum is defined in the schema; adding branches requires schema update
4. **UTC dates** — Quote dates are stored as provided; no timezone conversion
5. **English locale** — Column headers and formatting assume English
6. **No authentication** — The tool itself doesn't handle auth; the MCP server layer manages access
7. **Temporary storage** — Generated files may be cleaned up after 24-48 hours

---

## Example Input

```json
{
  "quote_id": "Q-2026-00142",
  "branch_code": "CLT",
  "customer_name": "ABC Plumbing Supply Co.",
  "customer_contact": "John Smith",
  "job_name": "Maple Ridge Phase 2",
  "job_address": "1234 Construction Way, Charlotte, NC 28202",
  "sales_rep": "Sarah Johnson",
  "quote_date": "2026-02-02",
  "expiration_date": "2026-03-04",
  "payment_terms": "Net 30",
  "freight_charge": 150.00,
  "tax_amount": 0,
  "line_items": [
    {
      "sku": "PVC-4-SCH40-10",
      "description": "4\" PVC Schedule 40 Pipe, 10ft",
      "uom": "EA",
      "quantity": 50,
      "list_price": 24.99,
      "cost": 15.50,
      "discount_percent": 0.10
    },
    {
      "sku": "PVC-4-90ELL",
      "description": "4\" PVC 90° Elbow",
      "uom": "EA",
      "quantity": 25,
      "list_price": 8.75,
      "cost": 5.25,
      "discount_percent": 0.15
    },
    {
      "sku": "PVC-CEMENT-QT",
      "description": "PVC Cement, Quart",
      "uom": "EA",
      "quantity": 10,
      "list_price": 12.50,
      "cost": 7.00,
      "discount_percent": 0
    }
  ]
}
```

---

## Example Output

```json
{
  "file_path": "/var/mcp/quotes/Quote_Q-2026-00142_CLT.xlsx",
  "download_url": "https://mcp.example.com/downloads/abc123/Quote_Q-2026-00142_CLT.xlsx",
  "file_name": "Quote_Q-2026-00142_CLT.xlsx",
  "summary": {
    "subtotal_material": 1431.19,
    "freight_charge": 150.00,
    "tax_amount": 0,
    "grand_total": 1581.19,
    "overall_margin_percent": 0.3642,
    "line_count": 3
  }
}
```

---

## Security Considerations

1. **No arbitrary file paths** — Output directory is server-configured, not user-controlled
2. **Sanitize inputs** — Quote ID and other strings should be sanitized before use in file names
3. **Cost data sensitivity** — The Cost and Margin columns contain confidential pricing data; consider:
   - Generating a separate "customer-facing" version with those columns removed
   - Applying sheet protection to hide margin data
4. **Download URL expiration** — URLs should be time-limited and single-use if possible

---

## Future Enhancements (Out of Scope for v1)

- Multi-language support
- Custom branding/logos per branch
- PDF export option
- Integration with ERP for SKU validation
- Customer-facing version without cost/margin data
- Approval workflow triggers
