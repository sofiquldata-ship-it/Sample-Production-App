import { Sample, ProductItem } from '../types/production';
import { cleanProductType } from '../utils/formatters';

export interface SheetParseResult {
  samples: Sample[];
  totalExcelRecords: number;
  totalSmplRecords: number;
  productTypes: string[];
  spreadsheetTitle?: string;
  sheetName?: string;
}

function formatExcelDate(val: any): string {
  if (val === undefined || val === null || val === '') return '-';
  const str = String(val).trim();
  if (!str) return '-';

  const num = Number(str);
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

export function parseGoogleSheet2DArray(rows2D: any[][]): SheetParseResult {
  if (!rows2D || rows2D.length === 0) {
    throw new Error('Google Sheet contains no data rows.');
  }

  // Scan first 20 rows to locate header row
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

  const headerRow = rows2D[headerRowIndex] || [];
  const headerKeys = headerRow.map((h: any) => String(h || '').trim());

  // Find column indices
  let productTypeColIdx = headerKeys.findIndex((k) => /^product\s*type$/i.test(k));
  if (productTypeColIdx === -1) productTypeColIdx = headerKeys.findIndex((k) => /product\s*type/i.test(k));
  if (productTypeColIdx === -1 && headerKeys.length > 23) productTypeColIdx = 23; // Column X

  let itemGroupColIdx = headerKeys.findIndex((k) => /^item\s*group$/i.test(k));
  if (itemGroupColIdx === -1) itemGroupColIdx = headerKeys.findIndex((k) => /item\s*group/i.test(k));
  if (itemGroupColIdx === -1 && headerKeys.length > 24) itemGroupColIdx = 24; // Column Y

  let smplColIdx = headerKeys.findIndex((k) =>
    /smpl\s*no|sample\s*no|sample\s*number|sample\s*id|sales\s*id|sales\s*order|order\s*no|work\s*order|pi\s*no|smpl/i.test(
      k
    )
  );

  // 4. Buyer
  let buyerColIdx = headerKeys.findIndex((k) => /^buyer(\s*name)?$/i.test(k));
  if (buyerColIdx === -1) buyerColIdx = headerKeys.findIndex((k) => /buyer/i.test(k));
  if (buyerColIdx === -1) buyerColIdx = headerKeys.findIndex((k) => /^brand$/i.test(k));
  if (buyerColIdx === -1) buyerColIdx = headerKeys.findIndex((k) => /customer\s*name|customer|party\s*name|account/i.test(k));

  // 4b. Column D "Retailer" (e.g. CHICCO, UNDER ARMOUR, HELLY HANSEN)
  let retailerColIdx = headerKeys.findIndex((k) => /^retailer$/i.test(k));
  if (retailerColIdx === -1) retailerColIdx = headerKeys.findIndex((k) => /retailer/i.test(k));
  if (retailerColIdx === -1 && headerKeys.length > 3) retailerColIdx = 3; // Column D fallback

  let dateColIdx = headerKeys.findIndex((k) =>
    /request\s*date|order\s*date|tentative|delivery\s*date|created\s*date|date/i.test(k)
  );

  let uniqueIdColIdx = headerKeys.findIndex((k) =>
    /unique\s*id|item\s*number|item\s*id|item\s*code|barcode|product\s*id/i.test(k)
  );

  // 7. Product / Item Name / Artwork With Version (strictly prioritizes "Artwork With Version")
  let itemNameColIdx = headerKeys.findIndex((k) => /artwork\s*with\s*version/i.test(k));
  if (itemNameColIdx === -1) itemNameColIdx = headerKeys.findIndex((k) => /artwork/i.test(k));
  if (itemNameColIdx === -1) itemNameColIdx = headerKeys.findIndex((k) => /item\s*name|product\s*name|description|particulars/i.test(k));

  const dataRows = rows2D.slice(headerRowIndex + 1);
  const sampleMap = new Map<string, { buyer: string; retailer: string; requestDate: string; products: ProductItem[] }>();
  const productTypesSet = new Set<string>();

  let totalExcelRecords = 0;

  dataRows.forEach((row, index) => {
    const allCells = row.map((c: any) => String(c ?? '').trim()).filter(Boolean);
    if (allCells.length === 0) return;

    totalExcelRecords++;

    // Column X: Product Type (e.g. LABEL, PAPER, POLYBAGS)
    const rawProductType = productTypeColIdx >= 0 && row[productTypeColIdx] !== undefined
      ? String(row[productTypeColIdx]).trim().toUpperCase()
      : '';
    if (rawProductType) {
      productTypesSet.add(rawProductType);
    }

    // Column Y: Item group (e.g. BANDEROLE, GUSSET BAG, etc.)
    const rawItemGroup = itemGroupColIdx >= 0 && row[itemGroupColIdx] !== undefined
      ? String(row[itemGroupColIdx]).trim()
      : rawProductType;
    const cleanedItemGroup = cleanProductType(rawItemGroup) || rawProductType || 'POLYBAGS';

    // Find SMPL ID
    let matchedSmplNo = '';
    if (smplColIdx >= 0 && row[smplColIdx]) {
      const val = String(row[smplColIdx]).trim();
      if (/SMPL/i.test(val)) {
        matchedSmplNo = val;
      }
    }

    if (!matchedSmplNo) {
      const smplWithNumCell = allCells.find((val) => /SMPL[\s/\-_]*\d+/i.test(val));
      if (smplWithNumCell) {
        const match = smplWithNumCell.match(/(SMPL[\s/\-_]*[A-Z0-9/\-_]+)/i);
        matchedSmplNo = match ? match[1].trim() : smplWithNumCell.trim();
      } else {
        const smplAnyCell = allCells.find((val) => /SMPL/i.test(val));
        if (smplAnyCell) {
          matchedSmplNo = smplAnyCell.trim();
        }
      }
    }

    if (!matchedSmplNo) {
      matchedSmplNo = `SMPL/${String(index + 1).padStart(5, '0')}/2026`;
    }

    const smplNo = matchedSmplNo.toUpperCase();
    const buyer = (buyerColIdx >= 0 && row[buyerColIdx] ? String(row[buyerColIdx]) : 'UNKNOWN BUYER')
      .trim()
      .toUpperCase();
    const retailer = (retailerColIdx >= 0 && row[retailerColIdx] ? String(row[retailerColIdx]) : '')
      .trim()
      .toUpperCase();
    const reqDate = formatExcelDate(dateColIdx >= 0 ? row[dateColIdx] : '');
    const uniqueId = String(
      (uniqueIdColIdx >= 0 && row[uniqueIdColIdx]) || `${26039700 + index}`
    ).trim();
    const rawItemName = itemNameColIdx >= 0 && row[itemNameColIdx] ? String(row[itemNameColIdx]).trim() : '';
    const productName = rawItemName || `${buyer.slice(0, 4)}_${cleanedItemGroup.replace(/\s+/g, '_')}_${index + 1}`;

    const productItem: ProductItem = {
      id: `P-GSH-${index + 1}`,
      name: productName,
      uniqueId,
      productType: cleanedItemGroup,
      productCategory: rawProductType,
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

  return {
    samples,
    totalExcelRecords,
    totalSmplRecords: samples.length,
    productTypes: sortedProductTypes.length > 0 ? sortedProductTypes : ['LABEL', 'PAPER', 'POLYBAGS'],
  };
}
