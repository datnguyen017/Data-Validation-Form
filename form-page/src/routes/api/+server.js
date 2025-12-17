import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const MONDAY_API = 'https://api.monday.com/v2';
const BOARD_ID = '18391825440';

export async function POST({ request, fetch }) {
  const MONDAY_API_KEY = env.MONDAY_API_KEY;

  if (!MONDAY_API_KEY) {
    return json({ error: 'Missing MONDAY_API_KEY' }, { status: 500 });
  }

  const data = await request.json();

  const columnValues = {
    email05ehfx6w: { email: data.email, text: data.email },
    short_textjquy7y9s: data.functional_area,
    short_text1woq5j81: data.description,
    multi_selecteqcgsmbr: data.target_column
      ? { labels: [data.target_column] }
      : undefined,
    short_textn4h7mq9n: data.expected_value,
    short_textee2me3mg: data.data_filters
  };

  Object.keys(columnValues).forEach((k) => {
    if (columnValues[k] === undefined) delete columnValues[k];
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

  const res = await fetch(MONDAY_API, {
    method: 'POST',
    headers: {
      Authorization: MONDAY_API_KEY,
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

  const result = await res.json();

  if (!res.ok || result?.errors) {
    return json(
      { error: result?.errors?.map((e) => e.message).join('; ') || 'Monday API error' },
      { status: 500 }
    );
  }

  return json({ success: true, itemId: result.data.create_item.id });
}
