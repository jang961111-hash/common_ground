import { View, Text, Button, TextInput } from 'react-native';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert('Sign up successful! You can now log in.');
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      alert('이메일을 입력해주세요.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:8081', // 웹 개발 환경
    });

    if (error) {
      alert(error.message);
    } else {
      alert('비밀번호 재설정 링크가 이메일로 전송되었습니다!');
    }
  };

const handleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  const userId = data.user?.id;
  if (!userId) {
    alert('No user id');
    return;
  }

  // 1) profiles upsert
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, display_name: email.split('@')[0] },
      { onConflict: 'id' }
    );

  if (profileError) {
    alert(profileError.message);
    return;
  }

  // 2) presence upsert (✅ 여기 추가)
  const { error: presenceError } = await supabase
    .from('presence')
    .upsert(
      {
        user_id: userId,
        is_online: true,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (presenceError) {
    alert(presenceError.message);
    return;
  }

  // 3) 이동
  navigation.replace('Home');
};



  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 24 }}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          width: 250,
          padding: 10,
        }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          borderWidth: 1,
          width: 250,
          padding: 10,
        }}
      />

      <Button title="Sign Up" onPress={handleSignUp} />
      <Button title="Login" onPress={handleLogin} />
      <Button title="비밀번호 찾기" onPress={handleResetPassword} color="#888" />
    </View>
  );
}
