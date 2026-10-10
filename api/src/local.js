import app from "./server.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`OpenTreasury API running on http://localhost:${PORT}`);
});