import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

type SupabasePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  new?: any;
  old?: any;
};

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    this.client = createClient(supabaseUrl!, supabaseKey!, {
      auth: { persistSession: false },
    });
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async upsertUser(userData: {
    user_id: string;
    clerk_user_id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    user_type?: string;
  }): Promise<any> {
    const { data, error } = await this.client
      .from('users')
      .upsert(
        {
          user_id: userData.user_id,
          clerk_user_id: userData.clerk_user_id,
          email: userData.email,
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          user_type: userData.user_type || 'guest',
        },
        { onConflict: 'user_id' },
      )
      .select();

    if (error) {
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }
    return data;
  }

  async getUserById(userId: string): Promise<any> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Supabase get user failed: ${error.message}`);
    }
    return data;
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.client.from('users').delete().eq('user_id', userId);
    if (error) {
      throw new Error(`Supabase delete user failed: ${error.message}`);
    }
  }

  subscribeToTable(table: string, callback: (payload: SupabasePayload) => void): RealtimeChannel {
    return this.client
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        callback(payload as SupabasePayload);
      })
      .subscribe((status) => {
        console.log(`Subscription status for ${table}: ${status}`);
      });
  }
}