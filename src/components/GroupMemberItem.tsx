// ==========================================
// GroupMemberItem — 그룹 멤버 아이템
// ==========================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GroupMember } from '../types';
import Avatar from './Avatar';
import { useTheme } from '../contexts/ThemeContext';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '../constants/theme';

interface GroupMemberItemProps {
  member: GroupMember;
  onPress?: () => void;
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  OWNER: { label: '방장', color: '#F59E0B' },
  ADMIN: { label: '관리자', color: '#8B5CF6' },
  MEMBER: { label: '', color: '' },
};

export const GroupMemberItem: React.FC<GroupMemberItemProps> = ({ member, onPress }) => {
  const { colors } = useTheme();
  const roleInfo = ROLE_CONFIG[member.role];

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: colors.gray100 }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Avatar
        name={member.displayName}
        emoji={member.avatarEmoji}
        customColor={member.avatarColor}
        size={40}
      />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.gray900 }]} numberOfLines={1}>
          {member.displayName}
        </Text>
        {roleInfo.label ? (
          <View style={[styles.roleBadge, { backgroundColor: `${roleInfo.color}18` }]}>
            <Text style={[styles.roleText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
          </View>
        ) : (
          <Text style={[styles.joinDate, { color: colors.gray400 }]}>
            {new Date(member.joinedAt).toLocaleDateString('ko-KR')} 가입
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.sm,
  },
  roleText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  joinDate: {
    fontSize: FONT_SIZE.xs,
  },
});
