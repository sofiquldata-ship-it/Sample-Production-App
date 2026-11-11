import { getAccessToken } from './authService';
import { parseGoogleSheet2DArray, SheetParseResult } from './googleSheetsParser';
import { Sample } from '../types/production';

export interface GoogleSpreadsheetMeta {
  id: string;
  title: string;
  sheets: { id: number; title: string }[];
}

export const extractSpreadsheetId = (input: string): string => {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  return trimmed;
};

export const fetchSpreadsheetMetadata = async (
  spreadsheetId: string,
  token?: string
): Promise<GoogleSpreadsheetMeta> => {
  const accessToken = token || getAccessToken();
  if (!accessToken) {
    throw new Error('No Google OAuth access token available.');
  }

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties(sheetId,title)`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to access Google Spreadsheet (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Google Sheet Database',
    sheets: (data.sheets || []).map((s: any) => ({
      id: s.properties?.sheetId,
      title: s.properties?.title,
    })),
  };
};

export const fetchSheetData = async (
  spreadsheetId: string,
  sheetName?: string,
  token?: string
): Promise<SheetParseResult> => {
  const accessToken = token || getAccessToken();
  if (!accessToken) {
    throw new Error('No Google OAuth access token available.');
  }

  let targetSheet = sheetName;
  let docTitle = 'Google Sheet Database';

  if (!targetSheet) {
    const meta = await fetchSpreadsheetMetadata(spreadsheetId, accessToken);
    docTitle = meta.title;
    targetSheet = meta.sheets[0]?.title || 'Sheet1';
  }

  const encodedSheet = encodeURIComponent(targetSheet);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodedSheet}'!A1:ZZ5000?valueRenderOption=UNFORMATTED_VALUE`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to read sheet values (${res.status}): ${errText}`);
  }

  const json = await res.json();
  const values: any[][] = json.values || [];

  const parsed = parseGoogleSheet2DArray(values);
  parsed.spreadsheetTitle = docTitle;
  parsed.sheetName = targetSheet;
  return parsed;
};

/**
 * Creates a brand new Google Spreadsheet in the user's Google Drive and populates it with sample records
 */
export const createAndPopulateGoogleSheet = async (
  title: string,
  samples: Sample[],
  token?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; rowCount: number }> => {
  const accessToken = token || getAccessToken();
  if (!accessToken) {
    throw new Error('No Google OAuth access token available. Please connect Google account.');
  }

  // 1. Create Spreadsheet via Sheets API v4
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || 'MPBL Sample Production Database',
      },
      sheets: [
        {
          properties: {
            title: 'Production Pending Report',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Spreadsheet (${createRes.status}): ${errText}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Build rows matching standard ERP Pending Report format
  // Column X (index 23): "Product Type" (POLYBAGS, PAPER, LABEL)
  // Column Y (index 24): "Item group" (BANDEROLE, GUSSET BAG, etc.)
  const headerRow = [
    'Sl',
    'SMPL No',
    'Customer',
    'Request Date',
    'Unique ID',
    'Product Name',
    'Status',
    'Current Stage',
    'Extrusion State',
    'Printing State',
    'Bag Making State',
    'Dispatch State',
    'Field13',
    'Field14',
    'Field15',
    'Field16',
    'Field17',
    'Field18',
    'Field19',
    'Field20',
    'Field21',
    'Field22',
    'Field23',
    'Product Type', // Column X (Index 23)
    'Item group',   // Column Y (Index 24)
  ];

  const dataRows: any[][] = [];
  let rowIndex = 1;

  samples.forEach((sample) => {
    sample.products.forEach((prod) => {
      const row = new Array(25).fill('');
      row[0] = rowIndex++;
      row[1] = sample.id;
      row[2] = sample.buyer;
      row[3] = sample.requestDate;
      row[4] = prod.uniqueId;
      row[5] = prod.name;
      row[6] = sample.status;
      row[7] = prod.currentStage;
      row[8] = prod.stages.Extrusion?.state || 'Pending';
      row[9] = prod.stages.Printing?.state || 'Pending';
      row[10] = prod.stages['Bag Making']?.state || 'Pending';
      row[11] = prod.stages.Dispatch?.state || 'Pending';
      row[23] = prod.productCategory || 'POLYBAGS'; // Column X
      row[24] = prod.productType || 'BANDEROLE';     // Column Y
      dataRows.push(row);
    });
  });

  const allValues = [headerRow, ...dataRows];

  // 3. Write data to the newly created sheet
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Production Pending Report'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: allValues,
      }),
    }
  );

  if (!appendRes.ok) {
    const errText = await appendRes.text();
    throw new Error(`Failed to write initial rows into Google Spreadsheet (${appendRes.status}): ${errText}`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    rowCount: dataRows.length,
  };
};
