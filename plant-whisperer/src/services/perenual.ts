import Constants from 'expo-constants';

type PerenualSearchItem = {
  id: number;
  common_name?: string | null;
  scientific_name?: string | null;
};

type PerenualDetails = {
  id: number;
  watering?: string | null;
  watering_general_benchmark?: { value?: string | number | null; unit?: string | null } | null;
  pruning_month?: string[] | null;
  growth_rate?: string | null;
  care_level?: string | null;
  pest_susceptibility?: string[] | null;
  soil?: string[] | null;
  hardiness?: { min?: string | number | null; max?: string | number | null } | null;
};

export type CareFields = {
  watering?: string | null;
  watering_general_benchmark?: { value?: string | number | null; unit?: string | null } | null;
  pruning_month?: string[] | null;
  growth_rate?: string | null;
  care_level?: string | null;
  pest_susceptibility?: string[] | null;
  soil?: string[] | null;
  hardiness?: { min?: string | number | null; max?: string | number | null } | null;
  source: { idUsed: number; note?: string };
};

function getKey(): string {
  const key = (Constants.expoConfig?.extra as any)?.expoPublicPerenualApiKey || process.env.EXPO_PUBLIC_PERENUAL_API_KEY;
  if (!key) throw new Error('Missing Perenual API key');
  return key;
}

async function searchSpecies(name: string): Promise<PerenualSearchItem[]> {
  const key = getKey();
  const url = `https://perenual.com/api/species-list?key=${encodeURIComponent(key)}&q=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Perenual search failed: ${res.status}`);
  const json = await res.json();
  const data = Array.isArray(json?.data) ? json.data : [];
  return data as PerenualSearchItem[];
}

async function getDetails(id: number): Promise<PerenualDetails> {
  const key = getKey();
  const url = `https://perenual.com/api/species/details/${id}?key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Perenual details failed: ${res.status}`);
  return (await res.json()) as PerenualDetails;
}

/**
 * Fetch care fields with free-tier fallback.
 * If the best match has id > 3000, use Monstera deliciosa instead.
 */
export async function fetchCareFieldsForName(name: string): Promise<CareFields | null> {
  // Search by full name first
  const results = await searchSpecies(name);
  if (!results || results.length === 0) return null;

  // Prefer exact scientific name match (case-insensitive), else first result
  const lower = name.toLowerCase();
  const exact = results.find((r) => (r.scientific_name || '').toLowerCase() === lower) || results[0];

  let idToUse = exact.id;
  let note: string | undefined;

  if (idToUse > 3000) {
    // Free tier fallback to Monstera deliciosa
    const fallbackSearch = await searchSpecies('Monstera deliciosa');
    const fallback = fallbackSearch[0];
    if (!fallback) return null;
    idToUse = fallback.id;
    note = `Free tier fallback used (original id ${exact.id} > 3000)`;
  }

  const details = await getDetails(idToUse);
  const care: CareFields = {
    watering: details.watering ?? null,
    watering_general_benchmark: details.watering_general_benchmark ?? null,
    pruning_month: details.pruning_month ?? null,
    growth_rate: details.growth_rate ?? null,
    care_level: details.care_level ?? null,
    pest_susceptibility: details.pest_susceptibility ?? null,
    soil: details.soil ?? null,
    hardiness: details.hardiness ?? null,
    source: { idUsed: idToUse, note },
  };
  return care;
}

