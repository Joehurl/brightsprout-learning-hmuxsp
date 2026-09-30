import React, { useWindowDimensions } from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

const TABS: TabBarItem[] = [
  { name: '(home)', route: '/(tabs)/(home)', icon: 'home', label: 'Learn' },
  { name: '(progress)', route: '/(tabs)/(progress)', icon: 'star', label: 'Progress' },
  { name: '(parent)', route: '/(tabs)/(parent)', icon: 'shield', label: 'Parent' },
];

export default function TabLayout() {
  const { width: screenWidth } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <Slot />
      <FloatingTabBar
        tabs={TABS}
        containerWidth={screenWidth * 0.75}
        borderRadius={35}
        bottomMargin={20}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
