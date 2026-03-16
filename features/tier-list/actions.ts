'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '../../lib/supabase/server';
import {
  createTierListInputSchema,
  submitRemixInputSchema,
  updateTierListInputSchema,
} from './schemas';

export async function createTierListAction(input: unknown) {
  const parsed = createTierListInputSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('No authenticated Supabase user available.');
  }

  const { data, error } = await supabase
    .from('tier_lists')
    .insert({
      owner_id: user.id,
      title: parsed.title,
      description: parsed.description,
      tiers: parsed.boardState.tiers,
      items: parsed.boardState.items,
      theme: parsed.boardState.theme,
      board_background: parsed.boardState.boardBackground,
      item_size: parsed.boardState.itemSize,
      image_fit: parsed.boardState.imageFit,
      remix_count: 0,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  revalidatePath('/');
  return { id: data.id as string };
}

export async function updateTierListAction(input: unknown) {
  const parsed = updateTierListInputSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('No authenticated Supabase user available.');
  }

  const { error } = await supabase
    .from('tier_lists')
    .update({
      tiers: parsed.boardState.tiers,
      items: parsed.boardState.items,
      theme: parsed.boardState.theme,
      board_background: parsed.boardState.boardBackground,
      item_size: parsed.boardState.itemSize,
      image_fit: parsed.boardState.imageFit,
    })
    .eq('id', parsed.id)
    .eq('owner_id', user.id);

  if (error) {
    throw error;
  }

  revalidatePath('/');
  return { id: parsed.id };
}

export async function submitRemixAction(input: unknown) {
  const parsed = submitRemixInputSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('No authenticated Supabase user available.');
  }

  const { data, error } = await supabase.rpc('submit_remix', {
    p_tier_list_id: parsed.tierListId,
    p_items: parsed.items,
  });

  if (error) {
    throw error;
  }

  revalidatePath('/');
  return { remixId: data as string };
}
