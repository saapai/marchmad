const TEAM_MAP = {
  'Michigan State': 'Michigan St',
  'Connecticut': 'UConn',
  "St. John's (NY)": "St. John's",
};

const ENTRY_IDS = {
  '60b90d90-238c-11f1-aedd-454352950998': 'Picks 1',
  '54ac5910-236b-11f1-a9b7-91d2aa9791a9': 'armpicks',
  'f361a0d0-2355-11f1-afca-ddfa712ab825': 'iLoveUCLA2',
  'f1c835e0-21c5-11f1-bf32-8794a055fbb5': 'duke #1',
  '179fe4f0-216e-11f1-ac80-a5a96d9405ea': "Quinn's Picks",
  '6031f220-20ed-11f1-bf32-8794a055fbb5': 'Kiel Main',
  'ca22ff00-236b-11f1-8d26-a16a57e49f3f': 'Maddie',
  '07ea2500-21a2-11f1-8b19-c75e24aaf1c4': "Ming Yin's Picks",
  '6f092560-238c-11f1-ab70-4345a54c4061': 'Picks 2',
  'ec829650-236b-11f1-aa6c-e53c1482e271': 'kachang',
  '2ffb2ad0-2161-11f1-8c06-2576181018d8': 'soupycows',
  'a6718a50-215d-11f1-8c06-2576181018d8': "MithilC3's Picks",
  '082c4470-215d-11f1-95cc-f1e43126b60f': 'Kiss my Assh',
  '695f90d0-23a6-11f1-94d4-6992ba69a1c4': 'gg',
  '6d08a420-2210-11f1-9e34-991f2faac692': 'HoustonLuvr',
  '3e4c3af0-218b-11f1-8b19-c75e24aaf1c4': 'ball iq',
  '396a0060-239a-11f1-bd28-4188ea51992a': 'e',
  'f62a72e0-2357-11f1-a2de-3d8497366683': 'charcharsuperstar',
  '5dbb16b0-2256-11f1-a9b7-91d2aa9791a9': 'We up',
  '6c18a3b0-2361-11f1-a5ec-a16faf8bfc29': 'Moonshot',
  '9ee02290-239e-11f1-b395-c7c0e1d326c9': 'Doot Universary',
  '89a77a00-21a9-11f1-8f49-418c4dea58ce': 'Realistic',
};

function normTeam(n) { return TEAM_MAP[n] || n; }

export async function fetchAllData() {
  const [liveScores, entries] = await Promise.all([
    fetchScoreboard(),
    fetchEntries(),
  ]);
  return { liveScores, entries, timestamp: new Date().toISOString() };
}

async function fetchScoreboard() {
  try {
    const r = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups=100&limit=50');
    const data = await r.json();
    if (!data.events) return [];
    return data.events.map(ev => {
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
  } catch (e) {
    return [];
  }
}

async function fetchEntries() {
  try {
    const ids = Object.keys(ENTRY_IDS);
    const results = await Promise.all(
      ids.map(id =>
        fetch(`https://gambit-api.fantasy.espn.com/apis/v1/challenges/277/entries/${id}?platform=chui&view=chui_default`)
          .then(r => r.json())
          .catch(() => null)
      )
    );
    return results.map((data, i) => {
      if (!data?.score) return null;
      const s = data.score;
      return {
        name: ENTRY_IDS[ids[i]],
        score: s.overallScore,
        percentile: s.percentile,
        wins: s.record?.wins,
        losses: s.record?.losses,
        max: s.possiblePointsMax,
      };
    }).filter(Boolean);
  } catch (e) {
    return [];
  }
}
