export default function LeaderboardTable({ leaderboard, title }) {
  if (!leaderboard || !leaderboard.entries || leaderboard.entries.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6">
        <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-4">{title}</h3>
        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
          <p>No leaderboard data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
        <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Top {leaderboard.entries.length} users • Total: {leaderboard.total}
        </p>
      </div>
      
      <div className="overflow-x-auto px-2">
        <table className="w-full text-[13px] text-left whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 dark:border-neutral-800">
              <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Rank
              </th>
              <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                User
              </th>
              <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {leaderboard.type === 'coins' ? 'Total Coins' : 
                 leaderboard.type === 'simulation' ? 'Profit/Loss' : 'Win Rate'}
              </th>
              {(leaderboard.type === 'win-rate' || leaderboard.type === 'simulation') && (
                <>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {leaderboard.type === 'simulation' ? 'Trades' : 'Predictions'}
                  </th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Win Rate
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/70 text-slate-600 dark:text-slate-300 font-medium">
            {leaderboard.entries.map((entry, index) => (
              <tr key={entry.userId} className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/70 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      index === 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400' :
                      index === 1 ? 'bg-slate-100 text-slate-800 dark:bg-neutral-800 dark:text-slate-300' :
                      index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400' :
                      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400'
                    }`}>
                      {entry.rank}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {entry.user?.profilePicUrl ? (
                        <img
                          className="w-9 h-9 rounded-full object-cover shadow-sm"
                          src={entry.user.profilePicUrl}
                          alt={entry.user.fullName}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-neutral-700 flex items-center justify-center">
                          <span className="text-slate-600 dark:text-slate-300 font-medium text-sm">
                            {(entry.fullName || entry.user?.fullName)?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {entry.fullName || entry.user?.fullName || 'Unknown User'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        ID: {entry.userId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {leaderboard.type === 'coins' ? 
                      `${entry.totalCoins?.toLocaleString() || 0} coins` :
                      leaderboard.type === 'simulation' ?
                      <span className={entry.totalProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {entry.totalProfitLoss >= 0 ? '+' : ''}{entry.totalProfitLoss?.toLocaleString() || 0} coins
                      </span> :
                      `${(entry.winRate || 0).toFixed(1)}%`
                    }
                  </div>
                </td>
                {(leaderboard.type === 'win-rate' || leaderboard.type === 'simulation') && (
                  <>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                      {leaderboard.type === 'simulation' ? entry.totalTrades || 0 : entry.totalPredictions || 0}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {(entry.winRate || 0).toFixed(1)}%
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
