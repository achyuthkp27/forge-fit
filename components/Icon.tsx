import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export type IconName = string;

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Accessibility hint for screen readers */
  accessibilityHint?: string;
  /** Whether the element is accessible */
  accessible?: boolean;
}

export const Icon = ({ 
  name, 
  size = 24, 
  color = '#fff',
  accessibilityLabel,
  accessibilityHint,
  accessible = true
}: IconProps) => {
  return (
    <Ionicons 
      name={name as any} 
      size={size} 
      color={color}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessible={accessible}
    />
  );
};

export const Icons: Record<string, string> = {
  home: 'home',
  info: 'information-circle',
  xCircle: 'close-circle',
  alertTriangle: 'alert-triangle',
  dumbbell: 'barbell',
  barbell: 'barbell',
  list: 'list',
  grid: 'grid',
  trendingUp: 'trending-up',
  messageCircle: 'chatbubbles',
  flame: 'flame',
  calendar: 'calendar',
  chevronRight: 'chevron-forward',
  chevronDown: 'chevron-down',
  chevronUp: 'chevron-up',
  chevronLeft: 'chevron-back',
  play: 'play',
  search: 'search',
  plus: 'add',
  mic: 'mic',
  volume2: 'volume-high',
  sparkles: 'sparkles',
  checkCircle: 'checkmark-circle',
  lightbulb: 'bulb',
  x: 'close',
  send: 'send',
  trophy: 'trophy',
  activity: 'barbell',
  settings: 'settings',
  homeOutline: 'home-outline',
  dumbbellOutline: 'barbell-outline',
  heart: 'heart-outline',
  heartFilled: 'heart',
  batteryLow: 'battery-dead',
  batteryMedium: 'battery-half',
  batteryHigh: 'battery-full',
  calculator: 'calculator',
  timer: 'timer',
  bell: 'notifications',
  download: 'download',
  upload: 'cloud-upload',
  trash: 'trash',
  refresh: 'refresh',
  edit2: 'create',
  circle: 'ellipse-outline',
  moon: 'moon-outline',
  copy: 'copy-outline',
  speaker: 'volume-high',
  speakerSlash: 'volume-mute',
  cable: 'infinite',
  machine: 'layers',
  bodyweight: 'body',
  lineChart: 'stats-chart',
  barChart: 'bar-chart',
  ruler: 'resize',
  file: 'document-text',
  fileText: 'document',
  zap: 'flash',
  clock: 'time-outline',
  share: 'share-outline',
  arrowLeft: 'arrow-back',
  history: 'time',
};