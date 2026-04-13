export type LoreCategory =
  | 'cosmology'
  | 'character_profiles'
  | 'geography'
  | 'magic_system'
  | 'factions'
  | 'timeline'
  | 'languages'
  | 'custom';

export interface LoreDocument {
  id: string;
  category: LoreCategory;
  title: string;
  content: string;
  priority: number;
  lastModified: number;
}
