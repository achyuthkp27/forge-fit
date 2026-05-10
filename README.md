<!-- ForgeFit - Premium Workout Tracker App -->

<div align="center">

<img src="https://raw.githubusercontent.com/achyuthkp27/forge-fit/main/assets/icon.png" width="120" height="120" alt="ForgeFit Logo">

<h1>
  <span style="color: #F97316;">Forge</span><span style="color: #fff;">Fit</span>
</h1>

> The ultimate AI-powered workout tracker for serious fitness enthusiasts

<p align="center">

[![Platform](https://img.shields.io/badge/Platform-iOS-000?style=flat&logo=apple)](https://expo.dev)
[![Framework](https://img.shields.io/badge/Framework-React%20Native%20%2B%20Expo-blue?style=flat&logo=react)](https://expo.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-orange?style=flat)](app.json)

</p>

**[Explore the App](#features)** · **[Installation](#installation)** · **[Screenshots](#screenshots)** · **[Tech Stack](#tech-stack)** · **[Contributing](#contributing)**

</div>

---

## Why ForgeFit?

ForgeFit isn't just another workout tracker—it's your personal AI-powered fitness companion built for **real gym-goers** who demand speed, simplicity, and results.

**What Sets Us Apart:**

- ⚡ **Lightning-Fast Logging** - Log sets with just 3 taps. No complex menus. No friction.
- 🤖 **AI Coach** - Natural language commands: "Create a chest day" or "Log bench press 80kg 8 reps"
- 🔥 **Smart Rest Timer** - Full-screen countdown visible from across the gym
- 💪 **Supersets & Circuits** - Build advanced workout templates with linked exercises
- 📊 **Progress That Matters** - PR tracking, volume analytics, muscle balance
- 🔄 **Offline-First** - Your data stays on your device. Always.

---

## Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Coach** | Chat to create workouts, log sets, track PRs, get workout suggestions |
| 🏋️ **Live Workout Tracking** | Real-time timer, set logging, rest alerts, exercise navigation |
| 📝 **Workout Builder** | Create gym/home workouts with supersets, circuits, AMRAP, EMOM |
| 📚 **Exercise Library** | 25+ exercises searchable by muscle group with custom additions |
| 📈 **Progress Analytics** | 28-day heatmap, PR board, volume charts, muscle balance |
| 📅 **Weekly Schedule** | Plan your week with scheduled workouts |
| ⚙️ **Settings** | Unit toggle (kg/lb), goals, experience level |

---

## Screenshots

<div align="center">

| Home Dashboard | Workouts | Exercise Library | Progress |
|:---:|:---:|:---:|:---:|
| <img src="https://via.placeholder.com/300x600/F97316/fff?text=Home+Dashboard" width="150"> | <img src="https://via.placeholder.com/300x600/18181B/fff?text=Workouts" width="150"> | <img src="https://via.placeholder.com/300x600/18181B/fff?text=Exercises" width="150"> | <img src="https://via.placeholder.com/300x600/18181B/fff?text=Progress" width="150"> |

| AI Coach | Live Workout | Workout Builder | Settings |
|:---:|:---:|:---:|:---:|
| <img src="https://via.placeholder.com/300x600/18181B/fff?text=AI+Coach" width="150"> | <img src="https://via.placeholder.com/300x600/22C55E/fff?text=Live+Workout" width="150"> | <img src="https://via.placeholder.com/300x600/18181B/fff?text=Builder" width="150"> | <img src="https://via.placeholder.com/300x600/18181B/fff?text=Settings" width="150"> |

</div>

---

## Installation

```bash
# Clone the repository
git clone https://github.com/achyuthkp27/forge-fit.git
cd forge-fit

# Install dependencies
npm install

# Generate native iOS project
npx expo prebuild --platform ios

# Run on iOS Simulator
npx expo run:ios
```

**Requirements:**
- Node.js 18+
- Xcode 15+ (for iOS)
- macOS (iOS development)

---

## Tech Stack

<div align="center">

| Layer | Technology |
|:---:|:---|
| **Framework** | [React Native](https://reactnative.dev/) + [Expo SDK 52](https://expo.dev/) |
| **Navigation** | [Expo Router v4](https://expo.dev/router) |
| **State** | [Zustand](https://zustand-demo.pmnd.rs/) |
| **Database** | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) |
| **UI** | [React Native](https://reactnative.dev/) + Linear Gradients |
| **Icons** | [@expo/vector-icons](https://docs.expo.dev/versions/latest/sdk/vector-icons/) |

</div>

---

## Project Structure

```
forge-fit/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home dashboard
│   │   ├── workouts.tsx   # Workout list & schedule
│   │   ├── exercises.tsx  # Exercise library
│   │   └── progress.tsx   # Analytics & PRs
│   ├── chat.tsx           # AI Coach
│   ├── workout.tsx        # Live workout session
│   ├── workout-builder.tsx# Create workouts
│   ├── schedule.tsx       # Weekly planner
│   └── settings.tsx       # App settings
├── stores/
│   └── workoutStore.ts   # Zustand state management
├── lib/
│   ├── db.ts             # SQLite database
│   └── aiService.ts       # AI processing
├── components/            # Reusable UI components
├── types/                  # TypeScript definitions
└── assets/                # Images & icons
```

---

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Expo](https://expo.dev/) for the amazing development experience
- [React Native](https://reactnative.dev/) for cross-platform power
- [Zustand](https://zustand-demo.pmnd.rs/) for simple state management

---

<div align="center">

**Made with ❤️ by [Achyuth KP](https://github.com/achyuthkp27)**

[![GitHub stars](https://img.shields.io/github/stars/achyuthkp27/forge-fit?style=social)](https://github.com/achyuthkp27/forge-fit)
[![GitHub forks](https://img.shields.io/github/forks/achyuthkp27/forge-fit?style=social)](https://github.com/achyuthkp27/forge-fit)

[Back to Top](#forgefit---premium-workout-tracker-app)

</div>