import { ACCOUNT_ID, BITTE_API_KEY } from './env';
import { Quote, PositionWithPnL, CurrentPosition } from './types';
import { TOKEN_LIST } from './utils';

const API_BASE_URL = 'https://bitte-autonomous-agent-dashboard.vercel.app'

interface ApiCallOptions {
  method: 'POST' | 'GET';
  body?: any;
  headers?: Record<string, string>;
}

async function makeApiCall(endpoint: string, options: ApiCallOptions) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${BITTE_API_KEY}`,
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method,
    headers,
    ...(options.body && { body: JSON.stringify(options.body) })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`API call failed: ${response.status} - ${error.error || response.statusText}`);
  }

  return response.json();
}

export async function storeTrade(quote: Quote): Promise<void> {
  try {
    await makeApiCall(`/api/trader/${ACCOUNT_ID}/store-trade`, {
      method: 'POST',
      body: {
        quote,
        tokenList: TOKEN_LIST
      }
    });
    console.log('Trade stored successfully via API');
  } catch (error) {
    console.error('Error storing trade via API:', error);
    throw error;
  }
}

export async function storePortfolioSnapshot(
  positions: PositionWithPnL[],
  totalUsd: number,
  previousUsd: number,
  aiReasoning?: string
): Promise<void> {
  try {
    await makeApiCall(`/api/trader/${ACCOUNT_ID}/store-snapshot`, {
      method: 'POST',
      body: {
        positions,
        totalUsd,
        previousUsd,
        aiReasoning
      }
    });
    console.log('Portfolio snapshot stored successfully via API');
  } catch (error) {
    console.error('Error storing portfolio snapshot via API:', error);
    throw error;
  }
}

export async function getCurrentPositions(accountId: string): Promise<CurrentPosition[]> {
  try {
    const response = await makeApiCall(`/api/trader/${accountId}/current-positions`, {
      method: 'GET'
    });
    console.log('Current positions fetched successfully via API');
    return response;
  } catch (error) {
    console.error('Error fetching current positions via API:', error);
    console.log('Returning empty positions array (likely agent just started)');
    return [];
  }
}
