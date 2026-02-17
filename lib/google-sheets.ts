import { google } from "googleapis";

function getAuth() {
  const credentials = JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}"
  );

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const SHEET_NAME = "Registrazioni";

/**
 * Append a new user row to Google Sheets on registration.
 * Header: UID | Nome | Cognome | Email | Scuola | Data Nascita | Check-in Timestamp
 */
export async function appendUserRow(data: {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
  dob: string;
}) {
  const sheets = getSheets();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:G`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [data.uid, data.firstName, data.lastName, data.email, data.school, data.dob, ""],
      ],
    },
  });
}

/**
 * Update the check-in timestamp for a user identified by UID.
 * Searches column A for the UID, then updates column G with the timestamp.
 */
export async function updateCheckinTimestamp(uid: string, timestamp: string) {
  const sheets = getSheets();

  // Get all UIDs from column A to find the row
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:A`,
  });

  const rows = response.data.values || [];
  let rowIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === uid) {
      rowIndex = i + 1; // Sheets is 1-indexed
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`User with UID ${uid} not found in Google Sheets`);
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!G${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[timestamp]],
    },
  });
}
