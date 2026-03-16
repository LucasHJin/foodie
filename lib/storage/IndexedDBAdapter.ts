import { get, set } from 'idb-keyval';
import { UserConfig, FoodEntry } from '../types';
import { StorageAdapter } from './StorageAdapter';

export class IndexedDBAdapter implements StorageAdapter {
  async loadConfig(): Promise<UserConfig | null> {
    return (await get<UserConfig>('foodie:config')) ?? null;
  }

  async saveConfig(config: UserConfig): Promise<void> {
    await set('foodie:config', config);
  }

  async loadDay(date: string): Promise<FoodEntry[]> {
    return (await get<FoodEntry[]>(`foodie:day:${date}`)) ?? [];
  }

  async saveDay(date: string, entries: FoodEntry[]): Promise<void> {
    await set(`foodie:day:${date}`, entries);
  }
}
