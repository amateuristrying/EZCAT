import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { AppTabBar } from '../../components/AppTabBar';
import { useAppStore } from '../../store/AppStore';
import HomeScreen from './HomeScreen';
import QuestionsScreen from './QuestionsScreen';
import MocksScreen from './MocksScreen';
import CoachScreen from './CoachScreen';

/**
 * AppShell — the post-onboarding app.
 *
 * Hosts the four main tabs (Home · Questions · Mocks · AI Coach) with a
 * shared floating bottom tab bar. Reached via "Start Practicing" on the
 * final onboarding screen.
 */
export default function AppShell() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.body}>
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'questions' && <QuestionsScreen />}
        {activeTab === 'mocks' && <MocksScreen />}
        {activeTab === 'coach' && <CoachScreen />}
      </View>
      <AppTabBar activeKey={activeTab} onChange={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },
  body: {
    flex: 1,
  },
});
