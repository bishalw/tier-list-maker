import type { PostgrestError } from '@supabase/supabase-js';
import { getBrowserSupabaseClient } from '../../lib/supabase/client';
import { buildCommunityConsensus } from './services/communityConsensus';
import { mapRemixRowToRecord, mapTierListRowToRecord } from './mappers';
import { submitRemixInputSchema } from './schemas';
import type { RemixRecord, RemixRow, TierListRecord, TierListRow } from './types';
import type { Item, Tier } from '../../types';

/** Postgres "invalid text representation" — an id that is not a valid uuid. */
const INVALID_TEXT_REPRESENTATION = '22P02';

function isMalformedIdError(error: PostgrestError | null) {
  return error?.code === INVALID_TEXT_REPRESENTATION;
}

export async function getTierListById(id: string): Promise<TierListRecord | null> {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('tier_lists')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    // A link with a junk id is a missing list, not a crash.
    if (isMalformedIdError(error)) {
      return null;
    }

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
    if (isMalformedIdError(error)) {
      return null;
    }

    throw error;
  }

  return data ? mapRemixRowToRecord(data as RemixRow) : null;
}

/**
 * Reads only the rankings of every remix on a list, never who submitted them.
 *
 * Consensus is public, but the identity of the people who contributed to it is
 * not, so this goes through an RPC that strips `user_id` rather than selecting
 * the remix rows directly.
 */
export async function getRemixItemsForConsensus(tierListId: string): Promise<Item[][]> {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase.rpc('get_remix_items', {
    p_tier_list_id: tierListId,
  });

  if (error) {
    if (isMalformedIdError(error)) {
      return [];
    }

    throw error;
  }

  const rows = (data ?? []) as { items: unknown }[];

  return rows.flatMap((row) => {
    const parsed = submitRemixInputSchema.shape.items.safeParse(row.items);
    return parsed.success ? [parsed.data] : [];
  });
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
  const remixItemsList = await getRemixItemsForConsensus(params.tierListId);
  return buildCommunityConsensus(params.items, params.tiers, remixItemsList);
}
