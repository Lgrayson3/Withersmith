import { db } from '../store/db';

const API_KEY_SETTING = 'anthropic_api_key';

export async function getApiKey(): Promise<string | null> {
  const record = await db.settings.get(API_KEY_SETTING);
  return record?.value ?? null;
}

export async function setApiKey(key: string): Promise<void> {
  await db.settings.put({ key: API_KEY_SETTING, value: key });
}

export async function clearApiKey(): Promise<void> {
  await db.settings.delete(API_KEY_SETTING);
}
