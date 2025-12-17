import { json } from '@sveltejs/kit';

const MONDAY_API = 'https://api.monday.com/v2';
const BOARD_ID = '18391825440'; // replace if your board id changes
const API_KEY = process.env.MONDAY_API_KEY;

export async function POST({ request }) {
  const data = await request.json();

  // Map form payload -> Monday column IDs
  const columnValues = {
    email05ehfx6w: { email: data.email, text: data.email }, // Email
    short_textjquy7y9s: data.functional_area, // Functional Area (text)
    short_text1woq5j81: data.description, // Description (text)
    multi_selecteqcgsmbr: data.target_column
      ? { labels: [data.target_column] }
      : undefined, // Columns (dropdown)
    short_textn4h7mq9n: data.expected_value, // Expected Value (text)
    short_textee2me3mg: data.data_filters // Data Filters (text)
  };

  // Optional: People column if you send an assignee id (person id from Monday)
  if (data.assigned_to) {
    columnValues.multiple_person_mkyj1z0t = {
      personsAndTeams: [{ id: data.assigned_to, type: 'person' }]
    };
  }

  // Remove undefined entries so Monday accepts the payload
  Object.keys(columnValues).forEach((key) => {
    if (columnValues[key] === undefined) {
      delete columnValues[key];
    }
  });

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

  if (!API_KEY) {
    return json({ error: 'Missing MONDAY_API_KEY on server' }, { status: 500 });
  }

  const res = await fetch(MONDAY_API, {
    method: 'POST',
    headers: {
      Authorization: API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      variables: {
        boardId: BOARD_ID,
        itemName: data.description || 'New Validation Request',
        columnValues: JSON.stringify(columnValues)
      }
    })
  });

  const result = await res.json().catch(() => null);

  const graphqlErrors = result?.errors;
  const apiErrorMessage =
    graphqlErrors?.map((e) => e.message).join('; ') ||
    result?.error_message ||
    (!res.ok ? `HTTP ${res.status}` : null);

  if (!res.ok || apiErrorMessage) {
    return json({ error: apiErrorMessage || 'Monday API failed' }, { status: 500 });
  }

  return json({ success: true, itemId: result?.data?.create_item?.id ?? null });
}
