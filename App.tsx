// ==========================================
// Common Ground - App Entry Point
// ==========================================
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, StyleSheet, Animated } from 'react-native';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { RootStackParamList, MainTabParamList } from './src/types';
import ErrorBoundary from './src/components/ErrorBoundary';

// --- Screens ---
import LandingScreen from './src/screens/LandingScreen';
import SignupScreen from './src/screens/SignupScreen';
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import DiscoverScreen from './src/screens/DiscoverScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UserDetailScreen from './src/screens/UserDetailScreen';
import ConversationTopicsScreen from './src/screens/ConversationTopicsScreen';
import ShareProfileScreen from './src/screens/ShareProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import DemoProfileScreen from './src/screens/DemoProfileScreen';
import ConnectionsScreen from './src/screens/ConnectionsScreen';
import ConversationsScreen from './src/screens/ConversationsScreen';
import ChatScreen from './src/screens/ChatScreen';
import StatsScreen from './src/screens/StatsScreen';
import BlockedUsersScreen from './src/screens/BlockedUsersScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import EditInterestsScreen from './src/screens/EditInterestsScreen';
import SnapshotGalleryScreen from './src/screens/SnapshotGalleryScreen';
import FeedScreen from './src/screens/FeedScreen';
import CompatibilityScreen from './src/screens/CompatibilityScreen';
import BadgesScreen from './src/screens/BadgesScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';
import CreateGroupScreen from './src/screens/CreateGroupScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import BookmarksScreen from './src/screens/BookmarksScreen';
import SearchScreen from './src/screens/SearchScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import ActivityTimelineScreen from './src/screens/ActivityTimelineScreen';
import UserNotesScreen from './src/screens/UserNotesScreen';
import TutorialScreen from './src/screens/TutorialScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ── 탭 아이콘 bounce 애니메이션 ──
function AnimatedTabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  const scale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.25, useNativeDriver: true, friction: 3, tension: 120 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }),
      ]).start();
    } else {
      scale.setValue(1);
    }
  }, [focused, scale]);

  return (
    <Animated.Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5, transform: [{ scale }] }}>
      {icon}
    </Animated.Text>
  );
}

// ── 하단 탭 네비게이션 ──
function MainTabs() {
  const { unreadCount } = useAuth();
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          let icon = '';
          if (route.name === 'Home') icon = '🏠';
          else if (route.name === 'Discover') icon = '🔍';
          else if (route.name === 'Groups') icon = '👥';
          else if (route.name === 'Profile') icon = '👤';

          return (
            <AnimatedTabIcon icon={icon} focused={focused} />
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
          borderTopWidth: 1,
          borderTopColor: colors.gray200,
          backgroundColor: colors.white,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '홈', tabBarAccessibilityLabel: '홈 탭' }} />
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ tabBarLabel: '발견', tabBarAccessibilityLabel: '발견 탭' }} />
      <Tab.Screen name="Groups" component={GroupsScreen} options={{ tabBarLabel: '그룹', tabBarAccessibilityLabel: '그룹 탭' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: '프로필', tabBarAccessibilityLabel: '프로필 탭' }} />
    </Tab.Navigator>
  );
}

// ── 로딩 화면 ──
function LoadingScreen() {
  const { colors } = useTheme();
  return (
    <View style={[loadingStyles.container, { backgroundColor: colors.white }]}>
      <Text style={loadingStyles.logo}>🤝</Text>
      <Text style={[loadingStyles.title, { color: colors.gray800 }]}>Common Ground</Text>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 56 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 12 },
});

// ── 루트 네비게이션 ──
function RootNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {isLoggedIn ? (
        <>
          {/* 메인 탭 */}
          <Stack.Screen name="Main" component={MainTabs} />
          {/* 스택 화면들 */}
          <Stack.Screen name="UserDetail" component={UserDetailScreen} />
          <Stack.Screen name="ConversationTopics" component={ConversationTopicsScreen} />
          <Stack.Screen name="ShareProfile" component={ShareProfileScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Connections" component={ConnectionsScreen} />
          <Stack.Screen name="Conversations" component={ConversationsScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Stats" component={StatsScreen} />
          <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="EditInterests" component={EditInterestsScreen} />
          <Stack.Screen name="SnapshotGallery" component={SnapshotGalleryScreen} />
          <Stack.Screen name="Feed" component={FeedScreen} />
          <Stack.Screen name="Compatibility" component={CompatibilityScreen} />
          <Stack.Screen name="Badges" component={BadgesScreen} />
          <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
          <Stack.Screen name="EventDetail" component={EventDetailScreen} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
          <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Insights" component={InsightsScreen} />
          <Stack.Screen name="ActivityTimeline" component={ActivityTimelineScreen} />
          <Stack.Screen name="UserNotes" component={UserNotesScreen} />
          <Stack.Screen name="Tutorial" component={TutorialScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="DemoProfile" component={DemoProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

// ── App 컴포넌트 ──
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
