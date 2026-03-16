import { UserConfig, FoodEntry } from '../types';

export interface StorageAdapter {
  loadConfig(): Promise<UserConfig | null>;
  saveConfig(config: UserConfig): Promise<void>;
  loadDay(date: string): Promise<FoodEntry[]>;
  saveDay(date: string, entries: FoodEntry[]): Promise<void>;
}
