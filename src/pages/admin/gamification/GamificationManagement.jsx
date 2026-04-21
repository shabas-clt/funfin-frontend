import { useState } from 'react';
import { Gamepad2, Target, HelpCircle, Award, Crown } from 'lucide-react';
import SpinConfigTab from './tabs/SpinConfigTab';
import MissionsTab from './tabs/MissionsTab';
import ChallengesTab from './tabs/ChallengesTab';
import BadgesTab from './tabs/BadgesTab';
import TitlesTab from './tabs/TitlesTab';

const TABS = [
  { id: 'spin', label: 'Daily spin', icon: Gamepad2 },
  { id: 'missions', label: 'Missions', icon: Target },
  { id: 'challenges', label: 'Daily challenges', icon: HelpCircle },
  { id: 'badges', label: 'Badges', icon: Award },
  { id: 'titles', label: 'Titles', icon: Crown },
];

export default function GamificationManagement() {
  const [tab, setTab] = useState('spin');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">
          Gamification
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure the daily spin reward pool, running missions, quiz-style
          daily challenges, and collectible badges and titles.
        </p>
      </div>

      <div className="border-b border-slate-200 dark:border-neutral-800">
        <nav className="flex gap-1 overflow-x-auto -mb-px" role="tablist">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div>
        {tab === 'spin' && <SpinConfigTab />}
        {tab === 'missions' && <MissionsTab />}
        {tab === 'challenges' && <ChallengesTab />}
        {tab === 'badges' && <BadgesTab />}
        {tab === 'titles' && <TitlesTab />}
      </div>
    </div>
  );
}
