export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  try {
    // Fetch ESPN challenge data for game results
    const espn = await fetch('https://gambit-api.fantasy.espn.com/apis/v1/challenges/277?platform=chui&view=chui_default');
    const espnData = await espn.json();

    // Fetch Polymarket championship odds
    let polyData = null;
    try {
      const poly = await fetch('https://gamma-api.polymarket.com/markets?closed=false&limit=20&tag=ncaa-basketball');
      polyData = await poly.json();
    } catch (e) { /* optional */ }

    // Extract resolved S16 games from ESPN propositions
    const resolved = [];
    if (espnData.propositions) {
      espnData.propositions.forEach(prop => {
        if (prop.scoringPeriodId === 3) {
          const winOutcome = prop.settled ? prop.outcomes?.find(o => o.winner) : null;
          resolved.push({
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
      polymarket: polyData,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
