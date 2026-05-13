// Exercise Form Tips

export const exerciseFormTips: Record<string, string[]> = {
  "Barbell Bench Press": [
    "Keep your feet flat on the floor for stability",
    "Retract your shoulder blades before pressing",
    "Lower the bar to your mid-chest, not your neck",
    "Keep your wrists straight, grip the bar firmly",
    "Don't bounce off your chest - control the descent",
  ],
  "Incline Bench Press": [
    "Set the bench to 30-45 degrees",
    "Keep your back flat against the bench",
    "Lower the bar to your upper chest",
    "Don't flare your elbows too wide",
  ],
  "Squat": [
    "Keep your chest up, don't round your back",
    "Drive through your heels, not your toes",
    "Go as low as mobility allows, at least parallel",
    "Keep your knees in line with your toes",
    "Brace your core before descending",
  ],
  "Deadlift": [
    "Hinge at the hips, not the waist",
    "Keep the bar close to your body throughout the lift",
    "Engage your lats (protect your armpits)",
    "Drive through your heels to stand",
    "Keep the bar over your mid-foot",
  ],
  "Overhead Press": [
    "Stand with feet shoulder-width apart",
    "Keep your core tight to prevent arching",
    "Press the bar straight up, not behind your head",
    "Lock out at the top without hyperextending",
  ],
  "Barbell Row": [
    "Keep your back flat, hinge at the hips",
    "Pull the bar to your lower chest",
    "Squeeze your shoulder blades at the top",
    "Let your arms hang straight down",
  ],
  "Pull-Up": [
    "Engage your lats by pulling your shoulders down",
    "Pull your elbows down and back",
    "Aim to get your chin over the bar",
    "Control the descent, don't just drop",
  ],
  "Lat Pulldown": [
    "Lean back slightly and pull to your chest",
    "Squeeze your lats at the bottom",
    "Don't pull behind your neck",
    "Control the weight on the way up",
  ],
  "Leg Press": [
    "Keep your lower back pressed against the pad",
    "Don't lock out your knees at the top",
    "Go as deep as mobility allows",
    "Keep your feet shoulder-width apart",
  ],
  "Romanian Deadlift": [
    "Keep the bar close to your legs",
    "Hinge at the hips, not bending at the waist",
    "Feel the stretch in your hamstrings",
    "Keep your back flat throughout",
  ],
  "Leg Curl": [
    "Don't swing the weight - control the movement",
    "Squeeze at the top of the contraction",
    "Full range of motion is more important than weight",
  ],
  "Calf Raise": [
    "Get a full stretch at the bottom",
    "Squeeze at the top",
    "Use a slight bend in the knees for variety",
  ],
  "Lateral Raise": [
    "Lead with your elbows, not your hands",
    "Keep a slight bend in your arms",
    "Don't go above shoulder height",
  ],
  "Bicep Curl": [
    "Keep your elbows pinned to your sides",
    "Don't swing the weight - use controlled movements",
    "Squeeze at the top",
  ],
  "Tricep Pushdown": [
    "Keep your elbows at your sides",
    "Don't flare your elbows out",
    "Squeeze the triceps at the bottom",
  ],
  "Plank": [
    "Keep your body in a straight line",
    "Don't let your hips sag or pike up",
    "Brace your core and breathe steadily",
  ],
};

export function getRandomFormTip(exerciseName: string): string {
  const tips = exerciseFormTips[exerciseName];
  if (!tips || tips.length === 0) {
    return getGeneralTip();
  }
  return tips[Math.floor(Math.random() * tips.length)];
}

export function getFormTipsForExercise(exerciseName: string): string[] {
  return exerciseFormTips[exerciseName] || [];
}

function getGeneralTip(): string {
  const generalTips = [
    "Focus on controlled movement throughout the set",
    "Breathe steadily - exhale on exertion, inhale on recovery",
    "Maintain proper form over heavy weight",
    "Stay hydrated throughout your workout",
    "Listen to your body - rest when needed",
  ];
  return generalTips[Math.floor(Math.random() * generalTips.length)];
}

// Get a tip based on muscle group
export function getTipForMuscleGroup(muscleGroup: string): string {
  const muscleTips: Record<string, string> = {
    Chest: "Focus on squeezing the chest at the top of each rep",
    Back: "Engage your lats by pulling your shoulder blades together",
    Shoulders: "Keep the movement controlled and avoid momentum",
    Arms: "Focus on the negative - slow descent builds muscle",
    Legs: "Drive through your heels for maximum activation",
    Core: "Brace like you're about to take a punch",
  };
  return muscleTips[muscleGroup] || getGeneralTip();
}