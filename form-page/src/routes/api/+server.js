import { json } from '@sveltejs/kit';

const MONDAY_API = 'https://api.monday.com/v2';
const BOARD_ID = 123456789; // 🔴 your board id
const API_KEY = process.env.MONDAY_API_KEY;

export async function POST({ request }) {
  const data = await request.json();

  const columnValues = {
    email: { email: data.email, text: data.email },
    status: data.functionalArea,
    description: data.description,
    text: data.columns,
    expected_value: data.expectedValue,
    long_text: data.dataFilters,
    date: { date: new Date().toISOString().split('T')[0] }
  };

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

  if (!res.ok) {
    return json({ error: 'Monday API failed' }, { status: 500 });
  }

  return json({ success: true });
}
