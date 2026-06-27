export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { messages, memoire } = req.body;

    const [worldRes, footballRes, newsRes] = await Promise.allSettled([
      fetch("https://mj-boop7770.github.io/Paulx-2.0-Worldcup2026/2026.json"),
      fetch("https://api.football-data.org/v4/competitions/2000/matches?status=LIVE", {
        headers: { "X-Auth-Token": process.env.FOOTBALL_API_KEY }
      }),
      fetch("https://mj-boop7770.github.io/Paulx-2.0-Worldcup2026/messages.json")
    ]);

    let worldData = "";
    let liveData = "";
    let newsData = "";

    try {
      const d = await worldRes.value.json();
      const matchs = d.rounds[0].matches.filter(m => m.score1 !== null).slice(-5);
      worldData = matchs.map(m => `${m.team1} ${m.score1}-${m.score2} ${m.team2} (${m.date})`).join(" | ");
    } catch(e) {}

    try {
      const d = await footballRes.value.json();
      const live = d.matches?.slice(0, 3) || [];
      liveData = live.map(m => `${m.homeTeam.shortName} ${m.score.fullTime.home??'?'}-${m.score.fullTime.away??'?'} ${m.awayTeam.shortName}`).join(" | ");
    } catch(e) {}

    try {
      const d = await newsRes.value.json();
      const articles = d.articles?.slice(0, 2) || [];
      newsData = articles.map(a => `${a.titre || a.titre_fr} : ${a.texte || a.texte_fr}`).join(" | ");
    } catch(e) {}

    const mem = memoire || {};
    const systemPrompt = `Tu es Octopus 🐙, assistant IA personnel de ${mem.nom || 'Mujos'}, développeur autodidacte de ${mem.ville || 'Maputo'}, ${mem.pays || 'Mozambique'}.
Projets : ${mem.projets || 'WorldCup2026, Octopus, Despacho Marítimo'}.
Compétences : ${mem.competences || 'JavaScript, Python, GitHub Actions'}.
Objectifs : ${mem.objectifs || 'réseau local, monétisation'}.
Tu réponds en français par défaut, aussi en portugais, anglais, swahili.
Tu es direct, intelligent, motivant. Tu appelles ton créateur "Mujos".
Sujets récents : ${mem.sujets || 'aucun'}.
${worldData ? `Derniers scores WorldCup2026 : ${worldData}` : ''}
${liveData ? `Matchs en direct : ${liveData}` : ''}
${newsData ? `Dernières news WorldCup : ${newsData}` : ''}`;

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-6).filter(m => m.role !== 'system')
        ],
        max_tokens: 1024
      })
    });

    const data = await r.json();
    res.status(200).json(data);
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: "Erreur: " + e.message });
  }
}
