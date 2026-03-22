import { getBrowserSupabaseClient } from '../../lib/supabase/client';
import { buildCommunityConsensus } from './services/communityConsensus';
import { mapRemixRowToRecord, mapTierListRowToRecord } from './mappers';
import type { RemixRecord, RemixRow, TierListRecord, TierListRow } from './types';
import type { Item, Tier } from '../../types';

export async function getTierListById(id: string): Promise<TierListRecord | null> {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('tier_lists')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapTierListRowToRecord(data as TierListRow) : null;
}

export async function getRemixById(tierListId: string, remixId: string): Promise<RemixRecord | null> {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('remixes')
    .select('*')
    .eq('tier_list_id', tierListId)
    .eq('id', remixId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapRemixRowToRecord(data as RemixRow) : null;
}

export async function getRemixesByTierListId(tierListId: string): Promise<RemixRecord[]> {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('remixes')
    .select('*')
    .eq('tier_list_id', tierListId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapRemixRowToRecord(row as RemixRow));
}

export async function getTierListsByOwner(ownerId: string): Promise<TierListRecord[]> {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('tier_lists')
    .select('*')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapTierListRowToRecord(row as TierListRow));
}

export async function getCommunityConsensus(params: {
  tierListId: string;
  items: Item[];
  tiers: Tier[];
}) {
  const remixes = await getRemixesByTierListId(params.tierListId);
  return buildCommunityConsensus(
    params.items,
    params.tiers,
    remixes.map((remix) => remix.items)
  );
}
