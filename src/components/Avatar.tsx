import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getAvatarColor } from '../services/mockData';
import { COLORS, BORDER_RADIUS } from '../constants/theme';

interface AvatarProps {
  name: string;
  url?: string | null;
  emoji?: string | null;
  customColor?: string | null;
  size?: number;
  showOnline?: boolean;
  isOnline?: boolean;
}

function Avatar({ name, url, emoji, customColor, size = 48, showOnline = false, isOnline = false }: AvatarProps) {
  const bgColor = customColor || getAvatarColor(name || 'U');
  const fontSize = emoji ? size * 0.5 : size * 0.4;
  const initial = name?.[0]?.toUpperCase() || '?';
  const displayContent = emoji || initial;

  return (
    <View
      style={[styles.wrapper, { width: size, height: size }]}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={`${name} 아바타${showOnline ? (isOnline ? ', 온라인' : ', 오프라인') : ''}`}
    >
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor,
          },
        ]}
      >
        <Text style={[styles.initial, { fontSize, color: emoji ? undefined : '#fff' }]}>{displayContent}</Text>
      </View>
      {showOnline && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isOnline ? COLORS.online : COLORS.offline,
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: size * 0.14,
              borderWidth: size * 0.05,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: '#fff',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderColor: '#fff',
  },
});

export default React.memo(Avatar);
