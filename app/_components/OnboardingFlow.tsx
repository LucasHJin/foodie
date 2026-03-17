'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Goal, ActivityLevel, Sex, UserConfig } from '@/lib/types';

interface OnboardingFlowProps {
  onComplete: (config: UserConfig) => void;
}

const GOALS: { value: Goal; label: string; desc: string }[] = [
  { value: 'bulk', label: 'Build', desc: '+300 kcal surplus' },
  { value: 'maintain', label: 'Maintain', desc: 'at TDEE' },
  { value: 'cut', label: 'Cut', desc: '−400 kcal deficit' },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Desk work, little movement' },
  { value: 'light', label: 'Light', desc: 'Exercise 1–3×/week' },
  { value: 'moderate', label: 'Moderate', desc: 'Exercise 3–5×/week' },
  { value: 'active', label: 'Active', desc: 'Hard exercise 6–7×/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Physical job + hard training' },
];

type Step = 'goal' | 'profile' | 'activity' | 'loading';

const stepVariants = {
  enter: (dir: number) => ({ x: dir * 32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -32, opacity: 0 }),
};

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>('goal');
  const [direction, setDirection] = useState(1);
  const [goal, setGoal] = useState<Goal>('maintain');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [error, setError] = useState('');

  const goForward = (next: Step) => { setDirection(1); setStep(next); };
  const goBack = (prev: Step) => { setDirection(-1); setStep(prev); };

  const handleProfileNext = () => {
    if (!weight || isNaN(Number(weight)) || Number(weight) < 30 || Number(weight) > 300) {
      setError('Enter a valid weight (30–300 kg)');
      return;
    }
    if (!age || isNaN(Number(age)) || Number(age) < 10 || Number(age) > 100) {
      setError('Enter a valid age (10–100)');
      return;
    }
    setError('');
    goForward('activity');
  };

  const handleFinish = async () => {
    setStep('loading');
    try {
      const res = await fetch('/api/ai/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, weight: Number(weight), age: Number(age), sex, activityLevel }),
      });
      const data = await res.json();
      onComplete({
        goal,
        weight: Number(weight),
        age: Number(age),
        sex,
        activityLevel,
        targets: data.targets,
      });
    } catch {
      setStep('activity');
      setError('Something went wrong. Please try again.');
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border border-stone-300 border-t-stone-700 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-stone-500">Calculating your targets…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <div className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-3">
            {step === 'goal' ? '1 / 3' : step === 'profile' ? '2 / 3' : '3 / 3'}
          </div>
          <div className="h-0.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-stone-400 rounded-full transition-all duration-500"
              style={{
                width: step === 'goal' ? '33%' : step === 'profile' ? '66%' : '100%',
              }}
            />
          </div>
        </div>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 'goal' && (
              <motion.div
                key="goal"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              >
                <h1 className="text-xl font-medium text-stone-900 mb-1 tracking-tight">What&apos;s your goal?</h1>
                <p className="text-sm text-stone-400 mb-7">This shapes your calorie and macro targets.</p>
                <div className="space-y-2.5">
                  {GOALS.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setGoal(value)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                        goal === value
                          ? 'border-stone-800 bg-stone-900 text-white'
                          : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <div className="font-medium text-sm">{label}</div>
                      <div className={`text-xs mt-0.5 ${goal === value ? 'text-stone-400' : 'text-stone-400'}`}>{desc}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => goForward('profile')}
                  className="w-full mt-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {step === 'profile' && (
              <motion.div
                key="profile"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              >
                <h1 className="text-xl font-medium text-stone-900 mb-1 tracking-tight">Your body</h1>
                <p className="text-sm text-stone-400 mb-7">Used to calculate your TDEE accurately.</p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-stone-500 block mb-1.5">Sex</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['male', 'female'] as Sex[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSex(s)}
                          className={`py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${
                            sex === s
                              ? 'border-stone-800 bg-stone-900 text-white'
                              : 'border-stone-200 bg-white hover:border-stone-300 text-stone-600'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-stone-500 block mb-1.5">Weight (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="70"
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm text-stone-800 outline-none focus:border-stone-400 transition-colors bg-white placeholder:text-stone-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-500 block mb-1.5">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="25"
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm text-stone-800 outline-none focus:border-stone-400 transition-colors bg-white placeholder:text-stone-300 font-mono"
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => goBack('goal')}
                    className="px-5 py-3 border border-stone-200 text-stone-600 text-sm font-medium rounded-xl hover:bg-stone-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleProfileNext}
                    className="flex-1 py-3 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'activity' && (
              <motion.div
                key="activity"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              >
                <h1 className="text-xl font-medium text-stone-900 mb-1 tracking-tight">Activity level</h1>
                <p className="text-sm text-stone-400 mb-7">How much do you move day-to-day?</p>
                <div className="space-y-2">
                  {ACTIVITY_LEVELS.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setActivityLevel(value)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                        activityLevel === value
                          ? 'border-stone-800 bg-stone-900 text-white'
                          : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs mt-0.5 text-stone-400">{desc}</div>
                    </button>
                  ))}
                </div>

                {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => goBack('profile')}
                    className="px-5 py-3 border border-stone-200 text-stone-600 text-sm font-medium rounded-xl hover:bg-stone-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinish}
                    className="flex-1 py-3 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors"
                  >
                    Calculate targets
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
