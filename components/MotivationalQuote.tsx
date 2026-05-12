import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const QUOTES = [
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Your body can stand almost anything. It's your mind that you have to convince.", author: "Unknown" },
  { text: "The harder you work, the better you get.", author: "Unknown" },
  { text: "Success is what comes after you stop making excuses.", author: "Luis Galarza" },
  { text: "Make yourself proud.", author: "Unknown" },
  { text: "Sore today, strong tomorrow.", author: "Unknown" },
  { text: "No pain, no gain. Shut up and train.", author: "Unknown" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It's not about having time, it's about making time.", author: "Unknown" },
  { text: "Your only limit is you.", author: "Unknown" },
  { text: "Train insane or remain the same.", author: "Unknown" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "Every rep counts. Every set matters.", author: "Unknown" },
  { text: "The mind quits before the body.", author: "Unknown" },
  { text: "Champions are made when no one is watching.", author: "Unknown" },
];

interface MotivationalQuoteProps {
  showAuthor?: boolean;
  style?: 'default' | 'card' | 'minimal';
}

export function MotivationalQuote({ showAuthor = true, style = 'default' }: MotivationalQuoteProps) {
  const [quote, setQuote] = useState(QUOTES[0]);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      setQuote(randomQuote);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (style === 'minimal') {
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.minimalQuote}>"{quote.text}"</Text>
        {showAuthor && <Text style={styles.minimalAuthor}>— {quote.author}</Text>}
      </Animated.View>
    );
  }

  if (style === 'card') {
    return (
      <Animated.View style={[styles.cardContainer, { opacity: fadeAnim }]}>
        <Text style={styles.cardQuote}>"{quote.text}"</Text>
        {showAuthor && <Text style={styles.cardAuthor}>— {quote.author}</Text>}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.quoteIcon}>💪</Text>
      <Text style={styles.quote}>"{quote.text}"</Text>
      {showAuthor && <Text style={styles.author}>— {quote.author}</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    marginVertical: 12,
  },
  quoteIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quote: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  author: {
    fontSize: 13,
    color: '#71717A',
    marginTop: 12,
    fontWeight: '500',
  },
  cardContainer: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#F97316',
    marginVertical: 8,
  },
  cardQuote: {
    fontSize: 14,
    color: '#fff',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  cardAuthor: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 8,
  },
  minimalQuote: {
    fontSize: 14,
    color: '#71717A',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  minimalAuthor: {
    fontSize: 12,
    color: '#52525B',
    marginTop: 4,
    textAlign: 'center',
  },
});