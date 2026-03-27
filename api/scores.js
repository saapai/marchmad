export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  const TEAM_MAP = {
    'Michigan State': 'Michigan St',
    'Connecticut': 'UConn',
    "St. John's (NY)": "St. John's",
  };
  function normTeam(n) { return TEAM_MAP[n] || n; }

  try {
    // Fetch ESPN challenge data for game results
    const espn = await fetch('https://gambit-api.fantasy.espn.com/apis/v1/challenges/277?platform=chui&view=chui_default');
    const espnData = await espn.json();

    // Fetch live scores from ESPN scoreboard
    let liveScores = [];
    try {
      const sb = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups=100&limit=50');
      const sbData = await sb.json();
      if (sbData.events) {
        liveScores = sbData.events.map(ev => {
          const comp = ev.competitions?.[0];
          if (!comp) return null;
          const c = comp.competitors || [];
          if (c.length < 2) return null;
          return {
            t1: normTeam(c[0]?.team?.location || ''),
            s1: parseInt(c[0]?.score) || 0,
            t2: normTeam(c[1]?.team?.location || ''),
            s2: parseInt(c[1]?.score) || 0,
            detail: comp.status?.type?.detail || '',
            state: comp.status?.type?.state || 'pre',
            completed: comp.status?.type?.completed || false,
          };
        }).filter(Boolean);
      }
    } catch (e) { /* scoreboard fetch optional */ }

    // Fetch Polymarket championship odds
    let polyData = null;
    try {
      const poly = await fetch('https://gamma-api.polymarket.com/markets?closed=false&limit=20&tag=ncaa-basketball');
      polyData = await poly.json();
    } catch (e) { /* optional */ }

    // Extract resolved games from ESPN propositions (all rounds)
    const resolved = [];
    if (espnData.propositions) {
      espnData.propositions.forEach(prop => {
        if (prop.scoringPeriodId >= 3 && prop.scoringPeriodId <= 6) {
          const winOutcome = prop.settled ? prop.outcomes?.find(o => o.winner) : null;
          resolved.push({
            period: prop.scoringPeriodId,
            sortOrder: prop.sortOrder,
            settled: !!prop.settled,
            winner: winOutcome?.competitor?.name || null
          });
        }
      });
    }

    // Extract entry scores if available
    const entries = [];
    if (espnData.entries) {
      espnData.entries.forEach(entry => {
        entries.push({
          name: entry.name,
          score: entry.score,
          percentile: entry.percentile,
          wins: entry.record?.wins,
          losses: entry.record?.losses
        });
      });
    }

    res.status(200).json({
      resolved,
      entries,
      liveScores,
      polymarket: polyData,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
