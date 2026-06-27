export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { messages, memoire } = req.body;
    const tavilyKey = process.env.TAVILY_KEY;
    const userMsg = messages[messages.length - 1].content;

    const needsWeb = /actualit|aujourd|news|météo|meteo|score|résultat|resultat|live|direct|maintenant|dernier|récent|recent/i.test(userMsg);

    let webContext = "";
    if (needsWeb && tavilyKey) {
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        const tavilyRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: userMsg,
            max_results: 2,
            search_depth: "basic"
          }),
          signal: controller.signal
        });
        const tavilyData = await tavilyRes.json();
        if (tavilyData.results?.length) {
          webContext = tavilyData.results
            .map(r => `${r.title}: ${r.content?.substring(0, 150)}`)
            .join(" | ");
        }
      } catch(e) {
        webContext = "";
      }
    }

    const mem = memoire || {};
    const systemPrompt = `Tu es Octopus 🐙, assistant IA personnel de ${mem.nom || 'Mujos'}, développeur autodidacte de ${mem.ville || 'Maputo'}, ${mem.pays || 'Mozambique'}.
Projets : ${mem.projets || 'WorldCup2026, Octopus, Despacho Marítimo'}.
Compétences : ${mem.competences || 'JavaScript, Python, GitHub Actions'}.
Tu réponds en français par défaut, aussi en portugais, anglais, swahili.
Tu es direct, intelligent, motivant.
${webContext ? `Infos internet : ${webContext}` : ''}`;

    const last5 = messages.slice(-5);

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
          ...last5.filter(m => m.role !== 'system')
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
