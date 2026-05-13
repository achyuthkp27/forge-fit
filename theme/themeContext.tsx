import React, { createContext, useContext, useState, useEffect } from 'react';
import { ColorSchemeName, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  systemTheme: ColorSchemeName;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const systemTheme = Appearance.getColorScheme() || 'light';

  // Load saved theme from async storage on initialization
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themePreference');
        if (savedTheme) {
          setThemeState(savedTheme as 'dark' | 'light');
        } else {
          // Fallback to system theme if no preference saved
          setThemeState(systemTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        // Fallback to system theme on error
        setThemeState(systemTheme);
      }
    };

    loadTheme();
  }, [systemTheme]);

   // Listen for system theme changes (only if user hasn't explicitly set a preference)
   useEffect(() => {
     const checkExplicitPreference = async () => {
       try {
         const savedTheme = await AsyncStorage.getItem('themePreference');
         return savedTheme !== null;
       } catch (error) {
         console.error('Failed to check theme preference:', error);
         return false; // Assume no explicit preference on error
       }
     };

     checkExplicitPreference().then(hasExplicitPreference => {
       if (!hasExplicitPreference) {
         const subscription = Appearance.addChangeListener(({ colorScheme }) => {
           if (colorScheme) {
             setThemeState(colorScheme);
           }
         });
         return () => subscription.remove();
       }
     });
   }, []);

  const toggleTheme = () => {
    setThemeState(prevTheme => {
      const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
      // Save to async storage
      AsyncStorage.setItem('themePreference', newTheme).catch(error => {
        console.error('Failed to save theme preference:', error);
      });
      return newTheme;
    });
  };

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    // Save to async storage
    AsyncStorage.setItem('themePreference', newTheme).catch(error => {
      console.error('Failed to save theme preference:', error);
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, systemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};