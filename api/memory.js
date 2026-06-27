export default async function handler(req, res) {
  try {
    const r = await fetch(
      `https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}/latest`,
      { headers: { "X-Master-Key": process.env.JSONBIN_KEY } }
    );
    const d = await r.json();
    res.status(200).json(d.record);
  } catch(e) {
    res.status(500).json({ error: "Erreur mémoire" });
  }
}
