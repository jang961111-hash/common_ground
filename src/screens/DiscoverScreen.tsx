import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { supabase } from '../lib/supabase';

type PresenceRow = {
  user_id: string;
  is_online: boolean;
  last_seen: string | null;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

type SnapshotRow = {
  id: string;
  user_id: string;
  image_path: string;
  caption: string | null;
  created_at: string;
};

type DiscoverItem = {
  userId: string;
  displayName: string;
  lastSeen: string | null;
  snapshot: SnapshotRow | null;
};

export default function DiscoverScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DiscoverItem[]>([]);

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('snapshots').getPublicUrl(path);
    return data.publicUrl;
  };

  const loadDiscover = async () => {
    setLoading(true);

    // 1) 온라인 유저(presence) 가져오기
    const { data: presenceData, error: presenceError } = await supabase
      .from('presence')
      .select('*')
      .eq('is_online', true)
      .order('updated_at', { ascending: false });

    if (presenceError) {
      alert(presenceError.message);
      setLoading(false);
      return;
    }

    const presenceList = (presenceData ?? []) as PresenceRow[];
    const userIds = presenceList.map((p) => p.user_id);

    if (userIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    // 2) profiles 가져오기
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) {
      alert(profilesError.message);
      setLoading(false);
      return;
    }

    const profileMap = new Map<string, ProfileRow>();
    (profilesData ?? []).forEach((p: ProfileRow) => profileMap.set(p.id, p));

    // 3) snapshots 가져오기(최신순) → 유저별 최신 1개만 뽑기
    const { data: snapshotsData, error: snapshotsError } = await supabase
      .from('snapshots')
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    if (snapshotsError) {
      alert(snapshotsError.message);
      setLoading(false);
      return;
    }

    const latestSnapshotMap = new Map<string, SnapshotRow>();
    (snapshotsData ?? []).forEach((s: SnapshotRow) => {
      if (!latestSnapshotMap.has(s.user_id)) latestSnapshotMap.set(s.user_id, s);
    });

    // 4) 합치기
    const merged: DiscoverItem[] = presenceList.map((pr) => {
      const profile = profileMap.get(pr.user_id) ?? null;
      const snap = latestSnapshotMap.get(pr.user_id) ?? null;

      const displayName =
        (profile?.display_name && profile.display_name.trim()) ||
        pr.user_id.slice(0, 6);

      return {
        userId: pr.user_id,
        displayName,
        lastSeen: pr.last_seen,
        snapshot: snap,
      };
    });

    setItems(merged);
    setLoading(false);
  };

  useEffect(() => {
    loadDiscover();
  }, []);

  // ✅ presence 변경을 실시간 반영 (간단 버전: 변경 이벤트마다 reload)
  useEffect(() => {
    const channel = supabase
      .channel('discover-presence')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'presence' },
        () => {
          loadDiscover();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22 }}>Discover</Text>
      <Text style={{ opacity: 0.7 }}>Open Networking ON인 사용자 목록</Text>

      {loading && <Text>Loading...</Text>}

      {!loading && items.length === 0 && (
        <Text style={{ marginTop: 12 }}>
          지금 온라인(Open Networking)인 사용자가 없습니다.
        </Text>
      )}

      {items.map((it) => (
        <Pressable
          key={it.userId}
          onPress={() => {
            // UserDetail 화면을 아직 안 만들었으면 일단 클릭해도 아무것도 안 해도 됨
            // navigation.navigate('UserDetail', { userId: it.userId });
          }}
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            padding: 12,
            borderRadius: 8,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 16 }}>{it.displayName}</Text>

          {it.snapshot?.image_path ? (
            <Image
              source={{ uri: getPublicUrl(it.snapshot.image_path) }}
              style={{ width: '100%', height: 200, backgroundColor: '#eee' }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: '100%',
                height: 200,
                backgroundColor: '#f0f0f0',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ opacity: 0.6 }}>No snapshot</Text>
            </View>
          )}

          <Text style={{ fontSize: 12, opacity: 0.6 }}>
            last_seen: {it.lastSeen ?? '-'}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
