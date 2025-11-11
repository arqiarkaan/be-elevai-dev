import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import type { Profile, TokenLog, Transaction, UsageLog } from '../types/index.js';

// Admin client with service role key (can bypass RLS)
export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Regular client with anon key
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

// Database operations
export const db = {
  // Profile operations
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  },

  async updateProfile(
    userId: string,
    updates: Partial<Profile>
  ): Promise<Profile | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return data;
  },

  async updateTokens(
    userId: string,
    newBalance: number
  ): Promise<Profile | null> {
    return this.updateProfile(userId, { tokens: newBalance });
  },

  // Token log operations
  async createTokenLog(log: Omit<TokenLog, 'id' | 'created_at'>): Promise<TokenLog | null> {
    const { data, error } = await supabaseAdmin
      .from('token_logs')
      .insert(log)
      .select()
      .single();

    if (error) {
      console.error('Error creating token log:', error);
      return null;
    }

    return data;
  },

  async getTokenLogs(userId: string, limit = 50): Promise<TokenLog[]> {
    const { data, error } = await supabaseAdmin
      .from('token_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching token logs:', error);
      return [];
    }

    return data || [];
  },

  // Transaction operations
  async createTransaction(
    tx: Omit<Transaction, 'id' | 'created_at'>
  ): Promise<Transaction | null> {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert(tx)
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return null;
    }

    return data;
  },

  async getTransaction(orderId: string): Promise<Transaction | null> {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }

    return data;
  },

  async updateTransaction(
    orderId: string,
    updates: Partial<Transaction>
  ): Promise<Transaction | null> {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .update(updates)
      .eq('order_id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      return null;
    }

    return data;
  },

  async getUserTransactions(
    userId: string,
    limit = 50
  ): Promise<Transaction[]> {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data || [];
  },

  // Usage log operations
  async createUsageLog(
    log: Omit<UsageLog, 'id' | 'created_at'>
  ): Promise<UsageLog | null> {
    const { data, error } = await supabaseAdmin
      .from('usage_logs')
      .insert(log)
      .select()
      .single();

    if (error) {
      console.error('Error creating usage log:', error);
      return null;
    }

    return data;
  },

  async getUserUsageLogs(userId: string, limit = 100): Promise<UsageLog[]> {
    const { data, error } = await supabaseAdmin
      .from('usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching usage logs:', error);
      return [];
    }

    return data || [];
  },

  async getFeatureUsageStats(
    userId: string,
    featureId: string
  ): Promise<{ total_uses: number; total_tokens: number }> {
    const { data, error } = await supabaseAdmin
      .from('usage_logs')
      .select('tokens_consumed')
      .eq('user_id', userId)
      .eq('feature_id', featureId);

    if (error || !data) {
      return { total_uses: 0, total_tokens: 0 };
    }

    return {
      total_uses: data.length,
      total_tokens: data.reduce((sum, log) => sum + log.tokens_consumed, 0),
    };
  },
};
