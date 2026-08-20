'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createServerSupabaseClient } from '../../lib/supabase/server';
import {
  createTierListInputSchema,
  deleteTierListInputSchema,
  recordViewInputSchema,
  renameTierListInputSchema,
  submitRemixInputSchema,
  updateTierListInputSchema,
} from './schemas';
import {
  ACTION_FAILURE_MESSAGES,
  actionFailure,
  actionSuccess,
  type ActionFailure,
  type ActionResult,
} from './results';
import type { Item } from '../../types';

interface OwnedRow {
  id: string;
  owner_id: string;
  updated_at: string;
}

function invalidInput(error: z.ZodError): ActionFailure {
  return actionFailure(
    'invalid-input',
    error.issues[0]?.message ?? ACTION_FAILURE_MESSAGES['invalid-input']
  );
}

async function requireUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Explains why an ownership-scoped write matched no rows.
 *
 * A Supabase update filtered by `owner_id` reports no error when it changes
 * nothing, so without this every write against someone else's list — or against
 * a list that has since changed — looked like a success.
 */
async function classifyMissingWrite(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  expectedUpdatedAt?: string
): Promise<ActionFailure> {
  const { data, error } = await supabase
    .from('tier_lists')
    .select('id, owner_id, updated_at')
    .eq('id', id)
    .maybeSingle<OwnedRow>();

  if (error) {
    return actionFailure('unavailable', ACTION_FAILURE_MESSAGES.unavailable);
  }

  if (!data) {
    return actionFailure('not-found', ACTION_FAILURE_MESSAGES['not-found']);
  }

  if (data.owner_id !== userId) {
    return actionFailure('forbidden', ACTION_FAILURE_MESSAGES.forbidden);
  }

  if (expectedUpdatedAt && data.updated_at !== expectedUpdatedAt) {
    return actionFailure('conflict', ACTION_FAILURE_MESSAGES.conflict);
  }

  return actionFailure('unavailable', ACTION_FAILURE_MESSAGES.unavailable);
}

export async function createTierListAction(
  input: unknown
): Promise<ActionResult<{ id: string; updatedAt: string }>> {
  const parsed = createTierListInputSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const supabase = await createServerSupabaseClient();
  const user = await requireUser(supabase);
  if (!user) {
    return actionFailure('unauthenticated', ACTION_FAILURE_MESSAGES.unauthenticated);
  }

  const { data, error } = await supabase
    .from('tier_lists')
    .insert({
      owner_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      is_public: parsed.data.isPublic,
      tiers: parsed.data.boardState.tiers,
      items: parsed.data.boardState.items,
      theme: parsed.data.boardState.theme,
      board_background: parsed.data.boardState.boardBackground,
      item_size: parsed.data.boardState.itemSize,
      image_fit: parsed.data.boardState.imageFit,
      remix_count: 0,
    })
    .select('id, updated_at')
    .single();

  if (error || !data) {
    return actionFailure('unavailable', ACTION_FAILURE_MESSAGES.unavailable);
  }

  revalidatePath('/');
  revalidatePath('/profile');
  return actionSuccess({ id: data.id as string, updatedAt: data.updated_at as string });
}

export async function updateTierListAction(
  input: unknown
): Promise<ActionResult<{ id: string; updatedAt: string }>> {
  const parsed = updateTierListInputSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const supabase = await createServerSupabaseClient();
  const user = await requireUser(supabase);
  if (!user) {
    return actionFailure('unauthenticated', ACTION_FAILURE_MESSAGES.unauthenticated);
  }

  let query = supabase
    .from('tier_lists')
    .update({
      ...(parsed.data.title != null && { title: parsed.data.title }),
      ...(parsed.data.description != null && { description: parsed.data.description }),
      ...(parsed.data.isPublic != null && { is_public: parsed.data.isPublic }),
      tiers: parsed.data.boardState.tiers,
      items: parsed.data.boardState.items,
      theme: parsed.data.boardState.theme,
      board_background: parsed.data.boardState.boardBackground,
      item_size: parsed.data.boardState.itemSize,
      image_fit: parsed.data.boardState.imageFit,
    })
    .eq('id', parsed.data.id)
    .eq('owner_id', user.id);

  if (parsed.data.expectedUpdatedAt) {
    query = query.eq('updated_at', parsed.data.expectedUpdatedAt);
  }

  const { data, error } = await query.select('id, updated_at');

  if (error) {
    return actionFailure('unavailable', ACTION_FAILURE_MESSAGES.unavailable);
  }

  if (!data || data.length === 0) {
    return classifyMissingWrite(supabase, parsed.data.id, user.id, parsed.data.expectedUpdatedAt);
  }

  revalidatePath('/');
  revalidatePath('/profile');
  return actionSuccess({ id: data[0].id as string, updatedAt: data[0].updated_at as string });
}

export async function submitRemixAction(
  input: unknown
): Promise<ActionResult<{ remixId: string }>> {
  const parsed = submitRemixInputSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const supabase = await createServerSupabaseClient();
  const user = await requireUser(supabase);
  if (!user) {
    return actionFailure('unauthenticated', ACTION_FAILURE_MESSAGES.unauthenticated);
  }

  const { data: list, error: listError } = await supabase
    .from('tier_lists')
    .select('id, owner_id, tiers, items')
    .eq('id', parsed.data.tierListId)
    .maybeSingle<{ id: string; owner_id: string; tiers: { id: string }[]; items: Item[] }>();

  if (listError) {
    return actionFailure('unavailable', ACTION_FAILURE_MESSAGES.unavailable);
  }

  if (!list) {
    return actionFailure('not-found', ACTION_FAILURE_MESSAGES['not-found']);
  }

  if (list.owner_id === user.id) {
    return actionFailure('forbidden', 'You cannot remix your own tier list.');
  }

  // A remix is a re-ranking of the creator's items, so anything the creator does
  // not have — or a tier they do not define — is dropped before it can pollute
  // the community consensus.
  const knownTierIds = new Set((list.tiers ?? []).map((tier) => tier.id));
  const knownItems = new Map((list.items ?? []).map((item) => [item.id, item]));
  const items = parsed.data.items
    .filter((item) => knownItems.has(item.id))
    .map((item) => ({
      ...knownItems.get(item.id)!,
      tierId: item.tierId !== null && knownTierIds.has(item.tierId) ? item.tierId : null,
    }));

  if (items.length === 0) {
    return actionFailure('invalid-input', 'This remix does not rank any of the original items.');
  }

  const { data, error } = await supabase.rpc('submit_remix', {
    p_tier_list_id: parsed.data.tierListId,
    p_items: items,
  });

  if (error || !data) {
    return actionFailure('unavailable', ACTION_FAILURE_MESSAGES.unavailable);
  }

  revalidatePath('/');
  return actionSuccess({ remixId: data as string });
}

export async function recordViewAction(input: unknown): Promise<void> {
  const parsed = recordViewInputSchema.safeParse(
    typeof input === 'string' ? { tierListId: input } : input
  );

  if (!parsed.success) {
    return;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : null;

    await supabase.rpc('record_view', {
      p_tier_list_id: parsed.data.tierListId,
      // Only used to de-duplicate anonymous views. It is client-supplied unless
      // a trusted proxy overwrites it, so it must never be treated as identity.
      p_viewer_ip: ip && ip.length <= 64 ? ip : null,
    });
  } catch {
    // Fire-and-forget — a failed view count must never break the page.
  }
}

export async function deleteTierListAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteTierListInputSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const supabase = await createServerSupabaseClient();
  const user = await requireUser(supabase);
  if (!user) {
    return actionFailure('unauthenticated', ACTION_FAILURE_MESSAGES.unauthenticated);
  }

  const { data, error } = await supabase
    .from('tier_lists')
    .delete()
    .eq('id', parsed.data.id)
    .eq('owner_id', user.id)
    .select('id');

  if (error) {
    return actionFailure('unavailable', ACTION_FAILURE_MESSAGES.unavailable);
  }

  if (!data || data.length === 0) {
    return classifyMissingWrite(supabase, parsed.data.id, user.id);
  }

  revalidatePath('/');
  revalidatePath('/profile');
  return actionSuccess({ id: parsed.data.id });
}

export async function renameTierListAction(
  input: unknown
): Promise<ActionResult<{ id: string; updatedAt: string }>> {
  const parsed = renameTierListInputSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const supabase = await createServerSupabaseClient();
  const user = await requireUser(supabase);
  if (!user) {
    return actionFailure('unauthenticated', ACTION_FAILURE_MESSAGES.unauthenticated);
  }

  const { data, error } = await supabase
    .from('tier_lists')
    .update({ title: parsed.data.title })
    .eq('id', parsed.data.id)
    .eq('owner_id', user.id)
    .select('id, updated_at');

  if (error) {
    return actionFailure('unavailable', ACTION_FAILURE_MESSAGES.unavailable);
  }

  if (!data || data.length === 0) {
    return classifyMissingWrite(supabase, parsed.data.id, user.id);
  }

  revalidatePath('/');
  revalidatePath('/profile');
  return actionSuccess({ id: data[0].id as string, updatedAt: data[0].updated_at as string });
}
