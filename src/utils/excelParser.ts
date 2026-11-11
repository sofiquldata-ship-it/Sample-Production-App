import * as XLSX from 'xlsx';
import { Sample, ProductItem } from '../types/production';
import { cleanProductType } from './formatters';

export interface ExcelParseResult {
  samples: Sample[];
  totalExcelRecords: number;
  totalSmplRecords: number;
  totalSmplItems: number;
  skippedBulkRecords: number;
  productTypeHeaderFound: string;
  productTypes: string[]; // Unique values from Column X "Product Type" (e.g. LABEL, PAPER, POLYBAGS)
}

/**
 * Converts Excel serial date numbers (e.g. 45827) or date strings into "DD-MMM-YYYY" format (e.g. "19-Jun-2025").
 */
function formatExcelDate(val: any): string {
  if (val === undefined || val === null || val === '') return '-';

  const str = String(val).trim();
  if (!str) return '-';

  const num = Number(str);

  // Check if it is an Excel serial date number (e.g., 30000 to 70000)
  if (!isNaN(num) && num > 30000 && num < 70000) {
    const utcDays = Math.floor(num - 25569);
    const dateObj = new Date(utcDays * 86400 * 1000);
    if (!isNaN(dateObj.getTime())) {
      return dateObj
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC',
        })
        .replace(/ /g, '-');
    }
  }

  return str;
}

/**
 * Parses an uploaded Excel (.xlsx, .xls) or .csv Pending Report.
 * - Pulls dropdown options strictly from Column X ("Product Type": LABEL, PAPER, POLYBAGS).
 * - Pulls card item group badge from Column Y ("Item group").
 * - Filters SMPL rows (or if no literal "SMPL" prefix exists in the sheet, uses the order/row identifier).
 */
export const parsePendingReportExcel = async (file: File): Promise<ExcelParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          throw new Error('Failed to read file content.');
        }

        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];

        // Read as 2D array first to locate the exact header row (e.g., Row 2 where headers live)
        const rows2D: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (!rows2D || rows2D.length === 0) {
          throw new Error('The uploaded sheet is empty.');
        }

        // Find the header row index (scanning top 20 rows)
        let headerRowIndex = 0;
        for (let r = 0; r < Math.min(20, rows2D.length); r++) {
          const rowCells = rows2D[r].map((c: any) => String(c || '').trim().toLowerCase());
          if (
            rowCells.some(
              (cell) =>
                cell === 'product type' ||
                cell.includes('product type') ||
                cell === 'item group' ||
                cell.includes('item group') ||
                cell.includes('customer') ||
                cell.includes('buyer') ||
                cell.includes('smpl')
            )
          ) {
            headerRowIndex = r;
            break;
          }
        }

        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
          range: headerRowIndex,
          defval: '',
        });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('No data rows found below the header row.');
        }

        const firstRowKeys = Object.keys(rawRows[0]);
        const headerRowArr = rows2D[headerRowIndex] || [];

        // Column X (index 23) fallback & Column Y (index 24) fallback
        const colXHeaderName = headerRowArr[23] ? String(headerRowArr[23]).trim() : '';
        const colYHeaderName = headerRowArr[24] ? String(headerRowArr[24]).trim() : '';

        // 1. Column X: "Product Type" (e.g. LABEL, PAPER, POLYBAGS) for the Dropdown
        const productTypeColKey =
          firstRowKeys.find((k) => /^product\s*type$/i.test(k.trim())) ||
          firstRowKeys.find((k) => /product\s*type/i.test(k.trim())) ||
          colXHeaderName ||
          'Product Type';

        // 2. Column Y: "Item group" for the Sample Card Badge
        const itemGroupColKey =
          firstRowKeys.find((k) => /^item\s*group$/i.test(k.trim())) ||
          firstRowKeys.find((k) => /item\s*group/i.test(k.trim())) ||
          colYHeaderName ||
          'Item group';

        // 3. SMPL / Sample / Order Number column
        const smplKey =
          firstRowKeys.find((k) =>
            /smpl\s*no|sample\s*no|sample\s*number|sample\s*id|sales\s*id|sales\s*order|order\s*no|work\s*order|pi\s*no|smpl/i.test(
              k
            )
          ) || '';

        // 4. Buyer column
        const buyerKey =
          firstRowKeys.find((k) => /^buyer(\s*name)?$/i.test(k.trim())) ||
          firstRowKeys.find((k) => /buyer/i.test(k.trim())) ||
          firstRowKeys.find((k) => /^brand$/i.test(k.trim())) ||
          firstRowKeys.find((k) => /customer\s*name|customer|party\s*name|account/i.test(k.trim())) ||
          'Buyer';

        // 4b. Column D "Retailer" (e.g. CHICCO, UNDER ARMOUR, HELLY HANSEN, JOULES FOR DILLARD)
        const colDHeaderName = headerRowArr[3] ? String(headerRowArr[3]).trim() : '';
        const retailerKey =
          firstRowKeys.find((k) => /^retailer$/i.test(k.trim())) ||
          firstRowKeys.find((k) => /retailer/i.test(k.trim())) ||
          colDHeaderName ||
          'Retailer';

        // 5. Request / Order Date column
        const dateKey =
          firstRowKeys.find((k) =>
            /request\s*date|order\s*date|tentative|delivery\s*date|created\s*date|date/i.test(k)
          ) || 'Request Date';

        // 6. Unique ID / Item Number column
        const uniqueIdKey =
          firstRowKeys.find((k) => /unique\s*id|item\s*number|item\s*id|item\s*code|barcode|product\s*id/i.test(k)) ||
          'Unique ID';

        // 7. Product / Item Name / Artwork With Version column (strictly prioritizes "Artwork With Version")
        const itemNameKey =
          firstRowKeys.find((k) => /artwork\s*with\s*version/i.test(k.trim())) ||
          firstRowKeys.find((k) => /artwork/i.test(k.trim())) ||
          firstRowKeys.find((k) => /item\s*name|product\s*name|description|particulars/i.test(k.trim())) ||
          '';

        // Check if the sheet contains any rows with "SMPL"
        const hasAnySmplRow = rawRows.some((row) =>
          Object.values(row).some((v) => /SMPL/i.test(String(v ?? '')))
        );

        const sampleMap = new Map<string, { buyer: string; retailer: string; requestDate: string; products: ProductItem[] }>();
        const productTypesSet = new Set<string>();

        let totalExcelRecords = 0;
        let totalSmplItems = 0;
        let skippedBulkRecords = 0;

        rawRows.forEach((row, index) => {
          const allRowValues = Object.values(row)
            .map((v) => String(v ?? '').trim())
            .filter(Boolean);
          if (allRowValues.length === 0) return;

          totalExcelRecords++;

          // Extract value strictly from Column X ("Product Type": e.g. LABEL, PAPER, POLYBAGS)
          const rawProductTypeColVal = String(
            row[productTypeColKey] ??
              (colXHeaderName ? row[colXHeaderName] : '') ??
              row['Product Type'] ??
              ''
          )
            .trim()
            .toUpperCase();

          if (rawProductTypeColVal) {
            productTypesSet.add(rawProductTypeColVal);
          }

          // Extract value from Column Y ("Item group")
          const rawItemGroupVal = String(
            row[itemGroupColKey] ??
              (colYHeaderName ? row[colYHeaderName] : '') ??
              row['Item group'] ??
              row['Item Group'] ??
              rawProductTypeColVal ??
              ''
          ).trim();
          const cleanedItemGroup = cleanProductType(rawItemGroupVal) || rawProductTypeColVal || 'POLYBAGS';

          // Find SMPL identifier in the row (e.g. "SMPL/00849/2026")
          let matchedSmplNo = '';

          if (smplKey && row[smplKey]) {
            const candidate = String(row[smplKey]).trim();
            if (/SMPL/i.test(candidate) || !hasAnySmplRow) {
              matchedSmplNo = candidate;
            }
          }

          if (!matchedSmplNo) {
            // First try matching SMPL followed by digits (e.g. SMPL/00930/2026)
            const smplWithNumCell = allRowValues.find((val) => /SMPL[\s/\-_]*\d+/i.test(val));
            if (smplWithNumCell) {
              const match = smplWithNumCell.match(/(SMPL[\s/\-_]*[A-Z0-9/\-_]+)/i);
              matchedSmplNo = match ? match[1].trim() : smplWithNumCell.trim();
            } else {
              const smplAnyCell = allRowValues.find((val) => /SMPL/i.test(val));
              if (smplAnyCell) {
                matchedSmplNo = smplAnyCell.trim();
              }
            }
          }

          // If the sheet has SMPL rows, skip non-SMPL bulk order rows
          if (hasAnySmplRow && !matchedSmplNo) {
            skippedBulkRecords++;
            return;
          }

          // Fallback ID only when the uploaded sheet doesn't use the "SMPL" prefix at all
          if (!matchedSmplNo) {
            matchedSmplNo = `SMPL/${String(index + 1).padStart(5, '0')}/2026`;
          }

          totalSmplItems++;
          const smplNo = matchedSmplNo.toUpperCase();
          const buyer = String(row[buyerKey] || row['Customer'] || row['Buyer'] || 'UNKNOWN BUYER')
            .trim()
            .toUpperCase();
          const retailer = String(row[retailerKey] || (colDHeaderName ? row[colDHeaderName] : '') || row['Retailer'] || '')
            .trim()
            .toUpperCase();
          const reqDate = formatExcelDate(row[dateKey] || row['Date'] || '');

          const uniqueId = String(row[uniqueIdKey] || `${26039700 + index}`).trim();
          const rawItemName = itemNameKey && row[itemNameKey] ? String(row[itemNameKey]).trim() : '';
          const productName =
            rawItemName || `${buyer.slice(0, 4)}_${cleanedItemGroup.replace(/\s+/g, '_')}_${index + 1}`;

          const productItem: ProductItem = {
            id: `P-IMP-${index + 1}`,
            name: productName,
            uniqueId,
            productType: cleanedItemGroup, // Column Y: "Item group"
            productCategory: rawProductTypeColVal, // Column X: "Product Type" (LABEL, PAPER, POLYBAGS)
            currentStage: 'Extrusion',
            stages: {
              Extrusion: { state: 'In Progress', startDate: reqDate !== '-' ? reqDate : undefined },
              Printing: { state: 'Pending' },
              'Bag Making': { state: 'Pending' },
              Dispatch: { state: 'Pending' },
            },
          };

          if (!sampleMap.has(smplNo)) {
            sampleMap.set(smplNo, {
              buyer,
              retailer,
              requestDate: reqDate,
              products: [productItem],
            });
          } else {
            const existing = sampleMap.get(smplNo)!;
            if (!existing.retailer && retailer) existing.retailer = retailer;
            existing.products.push(productItem);
          }
        });

        const samples: Sample[] = [];
        sampleMap.forEach((val, smplId) => {
          samples.push({
            id: smplId,
            buyer: val.buyer,
            retailer: val.retailer || undefined,
            requestDate: val.requestDate,
            status: 'In Production',
            products: val.products,
          });
        });

        const sortedProductTypes = Array.from(productTypesSet).sort();

        resolve({
          samples,
          totalExcelRecords,
          totalSmplRecords: samples.length,
          totalSmplItems,
          skippedBulkRecords,
          productTypeHeaderFound: productTypeColKey,
          productTypes: sortedProductTypes.length > 0 ? sortedProductTypes : ['LABEL', 'PAPER', 'POLYBAGS'],
        });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file.'));
    };

    reader.readAsArrayBuffer(file);
  });
};
