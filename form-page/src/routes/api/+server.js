import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const MONDAY_API = 'https://api.monday.com/v2';
const DEFAULT_BOARD_ID = '18391825440';
const DEFAULT_DATA_REQUEST_BOARD_ID = '18392625365';
const DEFAULT_FUNCTIONAL_BOARD_ID = '18392629306';

/**
 * @param {Record<string, unknown>} obj
 */
function removeUndefined(obj) {
  /** @type {Record<string, unknown>} */
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    cleaned[key] = value;
  }
  return cleaned;
}

/**
 * @param {unknown} value
 */
function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * @param {unknown} value
 */
function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v)).filter(Boolean);
}

/**
 * @param {unknown} value
 */
function normalizeStatusValue(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return { label: value.trim() };
  if (typeof value === 'number') return { index: value };
  if (typeof value === 'object') return value;
  return undefined;
}

/**
 * @param {unknown} value
 */
function normalizePeopleValue(value) {
  if (!value) return undefined;
  if (typeof value === 'number') {
    return { personsAndTeams: [{ id: value, kind: 'person' }] };
  }
  if (Array.isArray(value)) {
    const ids = value.map((v) => Number(v)).filter((v) => Number.isFinite(v));
    return ids.length
      ? { personsAndTeams: ids.map((id) => ({ id, kind: 'person' })) }
      : undefined;
  }
  if (typeof value === 'object') return value;
  return undefined;
}

export async function POST({ request, fetch }) {
  const MONDAY_API_KEY = env.MONDAY_API_KEY;
  const BOARD_ID = env.MONDAY_BOARD_ID || DEFAULT_BOARD_ID;
  const DATA_REQUEST_BOARD_ID = env.MONDAY_DATA_REQUEST_BOARD_ID || DEFAULT_DATA_REQUEST_BOARD_ID;
  const FUNCTIONAL_BOARD_ID =
    env.MONDAY_FUNCTIONAL_BOARD_ID || env.MONDAY_BOARD_ID || DEFAULT_FUNCTIONAL_BOARD_ID;

  if (!MONDAY_API_KEY) {
    return json({ error: 'Missing MONDAY_API_KEY' }, { status: 500 });
  }

  /** @type {any} */
  const data = await request.json();

  const issueType = normalizeString(data?.issue_type) || 'Data Validation';
  const email = normalizeString(data?.email);

  let itemName = normalizeString(data?.description) || 'New Request';

  /** @type {Record<string, unknown>} */
  let columnValues = {};
  /** @type {string} */
  let targetBoardId = BOARD_ID;

  if (issueType === 'Functional Issue') {
    targetBoardId = FUNCTIONAL_BOARD_ID;

    const functionalIssueType = normalizeString(data?.functional_issue_type);
    const problemDescription = normalizeString(data?.problem_description || data?.other_problem);
    const submitterName = normalizeString(data?.submitter_name);
    const submitterEmail = normalizeString(data?.submitter_email);
    const date = normalizeString(data?.date) || new Date().toISOString().slice(0, 10);
    const statusValue = normalizeStatusValue(data?.status || data?.status_label);
    const peopleValue = normalizePeopleValue(
      data?.person || data?.person_id || data?.person_ids
    );

    itemName =
      problemDescription ||
      (functionalIssueType ? `Functional Issue: ${functionalIssueType}` : 'Functional Issue');

    columnValues = removeUndefined({
      text_mkyrz9pq: problemDescription || functionalIssueType || undefined,
      text_mkywjt2k: submitterName || undefined,
      text_mkywsd3s: submitterEmail || undefined,
      status: statusValue || undefined,
      person: peopleValue || undefined,
      date4: date ? { date } : undefined
    });
  } else if (issueType === 'Data Request') {
    if (DATA_REQUEST_BOARD_ID) targetBoardId = DATA_REQUEST_BOARD_ID;

    const source = normalizeString(data?.source);
    const tableClass = normalizeString(data?.table_class);
    const fieldChar = normalizeString(data?.field_char);
    const reason = normalizeString(data?.reason);
    const submitterName = normalizeString(data?.submitter_name);
    const submitterEmail = normalizeString(data?.submitter_email);

    const date =
      normalizeString(data?.date) ||
      normalizeString(data?.timestamp_iso).slice(0, 10) ||
      new Date().toISOString().slice(0, 10);

    itemName =
      [tableClass, fieldChar].filter(Boolean).join(' - ') ||
      reason ||
      'New Data Request';

    columnValues = removeUndefined({
      text_mkyr15s3: source || undefined,
      text_mkyr7bwx: tableClass || undefined,
      text_mkyr611b: fieldChar || undefined,
      text_mkyrbx7t: reason || undefined,
      text_mkyrb653: submitterName || undefined,
      text_mkyrgs3v: submitterEmail || undefined,
      date4: date ? { date } : undefined
    });
  } else {
    const selectedColumns = Array.isArray(data?.target_columns)
      ? data.target_columns
      : data?.target_column
      ? [data.target_column]
      : [];
    const platformInput = normalizeStringArray(data?.platform_input);
    const platformText = platformInput.join(', ');

    columnValues = removeUndefined({
      ...(email ? { email05ehfx6w: { email, text: email } } : {}),
      short_textjquy7y9s: normalizeString(data?.functional_area) || undefined,
      short_text1woq5j81: normalizeString(data?.description) || undefined,
      multi_selecteqcgsmbr: selectedColumns.length ? { labels: selectedColumns } : undefined,
      short_textn4h7mq9n: normalizeString(data?.expected_value) || undefined,
      short_textee2me3mg: normalizeString(data?.data_filters) || undefined,
      text_mkyqecg6: platformText || undefined
    });

    itemName = normalizeString(data?.description) || 'New Validation Request';
  }

  const query = `
    mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId,
        item_name: $itemName,
        column_values: $columnValues
      ) {
        id
      }
    }
  `;

  const res = await fetch(MONDAY_API, {
    method: 'POST',
    headers: {
      Authorization: MONDAY_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      variables: {
        boardId: targetBoardId,
        itemName,
        columnValues: JSON.stringify(columnValues)
      }
    })
  });

  const result = await res.json();

  const createdItemId = result?.data?.create_item?.id;

  if (!res.ok || result?.errors || !createdItemId) {
    const errorMessage =
      result?.errors?.map((e) => e.message).join('; ') ||
      result?.error ||
      'Monday API error';

    return json(
      {
        error: errorMessage,
        request: {
          boardId: targetBoardId,
          itemName
        }
      },
      { status: 500 }
    );
  }

  return json({
    success: true,
    itemId: createdItemId,
    boardId: targetBoardId,
    itemName
  });
}
