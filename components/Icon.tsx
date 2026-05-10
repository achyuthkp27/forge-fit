import React from 'react';
import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export const Icon = ({ name, size = 24, color = '#fff' }: IconProps) => {
  return <Ionicons name={name} size={size} color={color} />;
};

export const Icons = {
  home: 'home' as IconName,
  dumbbell: 'barbell' as IconName,
  list: 'list' as IconName,
  grid: 'grid' as IconName,
  trendingUp: 'trending-up' as IconName,
  messageCircle: 'chatbubbles' as IconName,
  flame: 'flame' as IconName,
  calendar: 'calendar' as IconName,
  chevronRight: 'chevron-forward' as IconName,
  chevronDown: 'chevron-down' as IconName,
  chevronUp: 'chevron-up' as IconName,
  chevronLeft: 'chevron-back' as IconName,
  play: 'play' as IconName,
  search: 'search' as IconName,
  plus: 'add' as IconName,
  mic: 'mic' as IconName,
  volume2: 'volume-high' as IconName,
  sparkles: 'sparkles' as IconName,
  checkCircle: 'checkmark-circle' as IconName,
  lightbulb: 'bulb' as IconName,
  x: 'close' as IconName,
  send: 'send' as IconName,
  trophy: 'trophy' as IconName,
  activity: 'fitness' as IconName,
  settings: 'settings' as IconName,
  homeOutline: 'home-outline' as IconName,
  dumbbellOutline: 'barbell-outline' as IconName,
  heart: 'heart-outline' as IconName,
  heartFilled: 'heart' as IconName,
  batteryLow: 'battery-dead' as IconName,
  batteryMedium: 'battery-half' as IconName,
  batteryHigh: 'battery-full' as IconName,
  calculator: 'calculator' as IconName,
  timer: 'timer' as IconName,
  bell: 'notifications' as IconName,
  download: 'download' as IconName,
  upload: 'cloud-upload' as IconName,
  trash: 'trash' as IconName,
  refresh: 'refresh' as IconName,
};