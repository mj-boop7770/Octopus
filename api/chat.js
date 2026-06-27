export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { messages, memoire } = req.body;
    const userMsg = messages[messages.length - 1].content;

    const mem = memoire || {};
    const systemPrompt = `Tu es Octopus 🐙, assistant IA personnel de ${mem.nom || 'Mujos'}, développeur autodidacte de ${mem.ville || 'Maputo'}, ${mem.pays || 'Mozambique'}.
Projets : ${mem.projets || 'WorldCup2026, Octopus, Despacho Marítimo'}.
Compétences : ${mem.competences || 'JavaScript, Python, GitHub Actions'}.
Objectifs : ${mem.objectifs || 'réseau local, monétisation'}.
Tu réponds en français par défaut, aussi en portugais, anglais, swahili.
Tu es direct, intelligent, motivant. Tu appelles ton créateur "Mujos".
Sujets récents : ${mem.sujets || 'aucun'}.`;

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
          ...messages.filter(m => m.role !== 'system')
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
