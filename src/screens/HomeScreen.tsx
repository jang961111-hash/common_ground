import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button, Image, TextInput, ScrollView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';

type SnapshotRow = {
  id: string;
  user_id: string;
  image_path: string;
  caption: string | null;
  created_at: string;
};

export default function HomeScreen({ navigation }: any) {
  const [userId, setUserId] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [openNetworking, setOpenNetworking] = useState<boolean>(true); // ✅ 기본값 ON (원하면 false로 시작)
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ Storage public URL
  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('snapshots').getPublicUrl(path);
    return data.publicUrl;
  };

  // ✅ 내 presence를 upsert 하는 공용 함수
  const upsertPresence = async (uid: string, online: boolean) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('presence')
      .upsert(
        {
          user_id: uid,
          is_online: online,
          last_seen: now,
          updated_at: now,
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.log('presence upsert error:', error.message);
    }
  };

  const loadMySnapshots = async (uid: string) => {
    const { data, error } = await supabase
      .from('snapshots')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }
    setSnapshots(data ?? []);
  };

  const loadMe = async () => {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id ?? null;

    setUserId(uid);

    if (!uid) {
      navigation.replace('Login');
      return;
    }

    // ✅ Home 진입 시: presence를 "openNetworking 값"에 맞춰 반영
    await upsertPresence(uid, openNetworking);

    // ✅ 내 스냅샷 로드
    await loadMySnapshots(uid);
  };

  // ✅ 웹 업로드용 파일 피커
  const openFilePicker = () => {
    if (Platform.OS !== 'web') {
      alert('지금은 웹 업로드부터 성공시키자. (모바일은 다음 단계에서 붙임)');
      return;
    }
    fileInputRef.current?.click();
  };

  // ✅ 파일 선택 후 Storage 업로드 + DB insert
  const onFilePicked = async (e: any) => {
    if (!userId) {
      alert('Not logged in');
      return;
    }

    const file: File | undefined = e.target.files?.[0];
    if (!file) return;

    const safeName = file.name.replace(/\s+/g, '_');
    const path = `${userId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('snapshots')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      alert(`Upload error: ${uploadError.message}`);
      return;
    }

    const { error: insertError } = await supabase.from('snapshots').insert({
      user_id: userId,
      image_path: path,
      caption: caption.trim() ? caption.trim() : null,
    });

    if (insertError) {
      alert(`DB insert error: ${insertError.message}`);
      return;
    }

    setCaption('');
    await loadMySnapshots(userId);
    alert('Snapshot uploaded!');
    if (e?.target) e.target.value = '';
  };

  // ✅ Open Networking 토글 (presence.is_online을 이 버튼이 결정)
  const toggleOpenNetworking = async () => {
    if (!userId) return;

    const next = !openNetworking;
    setOpenNetworking(next);

    await upsertPresence(userId, next);
  };

  // ✅ 로그아웃: offline 처리 → signOut → Login 이동
  const handleSignOut = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (user) {
      await upsertPresence(user.id, false);
    }

    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ (선택) heartbeat: openNetworking이 ON일 때만 last_seen 갱신
  useEffect(() => {
    if (!userId) return;
    if (!openNetworking) return;

    const interval = setInterval(() => {
      upsertPresence(userId, true);
    }, 30_000);

    return () => clearInterval(interval);
  }, [userId, openNetworking]);

  // ✅ (선택) Realtime 구독: presence 변경을 콘솔로 확인
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('presence-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'presence' },
        (payload) => {
          console.log('Presence changed:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22 }}>Home</Text>

      {/* ✅ Discover 이동 버튼 추가 */}
      <Button title="Go to Discover" onPress={() => navigation.navigate('Discover')} />

      {/* ✅ Open Networking 토글 */}
      <Button
        title={openNetworking ? 'Open Networking: ON' : 'Open Networking: OFF'}
        onPress={toggleOpenNetworking}
      />

      <TextInput
        placeholder="caption (optional)"
        value={caption}
        onChangeText={setCaption}
        style={{ borderWidth: 1, padding: 10, width: 320 }}
      />

      <Button title="Upload Snapshot (Web)" onPress={openFilePicker} />
      <Button title="Sign out" onPress={handleSignOut} />

      {Platform.OS === 'web' && (
        <input
          ref={(el) => (fileInputRef.current = el)}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={onFilePicked}
        />
      )}

      <Text style={{ marginTop: 16, fontSize: 16 }}>My Snapshots</Text>

      {snapshots.map((s) => (
        <View key={s.id} style={{ borderWidth: 1, padding: 10, gap: 8 }}>
          <Image
            source={{ uri: getPublicUrl(s.image_path) }}
            style={{ width: 320, height: 200, backgroundColor: '#eee' }}
            resizeMode="cover"
          />
          <Text>{s.caption ?? ''}</Text>
          <Text style={{ fontSize: 12, opacity: 0.6 }}>{s.created_at}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
