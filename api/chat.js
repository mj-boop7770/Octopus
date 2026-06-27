export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const binId = process.env.JSONBIN_BIN_ID;
    const jsonbinKey = process.env.JSONBIN_KEY;
    const memRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: { 'X-Master-Key': jsonbinKey }
    });
    const memData = await memRes.json();
    const memoire = memData.record;
    const systemPrompt = `Tu es Octopus 🐙, assistant IA personnel de ${memoire.utilisateur.nom}, développeur autodidacte de ${memoire.utilisateur.ville}, ${memoire.utilisateur.pays}. 
Ses projets : ${memoire.utilisateur.projets.join(', ')}.
Ses compétences : ${memoire.utilisateur.competences.join(', ')}.
Ses objectifs : ${memoire.utilisateur.objectifs.join(', ')}.
Tu réponds en français par défaut, aussi en portugais, anglais, swahili.
Tu es direct, intelligent, motivant. Tu appelles ton créateur "${memoire.preferences_octopus.appelle_createur}".
Sujets récents : ${memoire.conversations.sujets_recents.join(', ') || 'aucun'}.`;
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: req.body.model,
        messages: [
          { role: "system", content: systemPrompt },
          ...req.body.messages.filter(m => m.role !== 'system')
        ],
        max_tokens: req.body.max_tokens
      })
    });
    const data = await r.json();
    const rep = data.choices[0].message.content;
    const sujets = memoire.conversations.sujets_recents || [];
    const dernierMsg = req.body.messages[req.body.messages.length - 1].content;
    if (!sujets.includes(dernierMsg.substring(0, 50))) {
      sujets.unshift(dernierMsg.substring(0, 50));
      if (sujets.length > 10) sujets.pop();
      memoire.conversations.sujets_recents = sujets;
      memoire.conversations.derniere_session = new Date().toISOString().split('T')[0];
      await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': jsonbinKey
        },
        body: JSON.stringify(memoire)
      });
    }
    res.status(200).json(data);
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur: " + e.message });
  }
        }
