// Scaneia todas as colunas string do DB procurando mojibake real
// (double-encoded UTF-8 / Latin-1). O padrão é: caractere Latin-1 de 2 bytes
// (Ã, Â seguidos de byte alto) em strings que deveriam ter acentos UTF-8.
// Uso: node scripts/scan-mojibake.cjs
// Saída: lista tabelas.coluna com match + amostra do conteúdo (max 5/tabela).
// Exit 0 mesmo se encontrar (é diagnóstico, não erro).
const mysql = require("mysql2/promise");

const MOJIBAKE_CLASS = "[ÃÂ][¡-¿¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾]";

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "orbita",
    password: process.env.DB_PASSWORD || "06464ae5cdf614aae10949d7e32b456b",
    database: process.env.DB_NAME || "orbita",
  });
  const [tables] = await c.query("SHOW TABLES");
  const pattern = new RegExp(MOJIBAKE_CLASS);
  const found = [];
  for (const t of tables) {
    const tn = Object.values(t)[0];
    const [cols] = await c.query("SHOW COLUMNS FROM `" + tn + "`");
    const strCols = cols.filter(c => /varchar|text|char|enum/i.test(c.Type)).map(c => c.Field);
    for (const col of strCols) {
      try {
        const [rows] = await c.query(
          "SELECT id, `" + col + "` AS v FROM `" + tn + "` WHERE `" + col + "` RLIKE '" + MOJIBAKE_CLASS + "' LIMIT 5"
        );
        for (const r of rows) {
          if (r.v && pattern.test(r.v)) {
            found.push({ t: tn, c: col, id: r.id, v: r.v });
          }
        }
      } catch (_e) { /* skip */ }
    }
  }
  console.log("--- colunas com mojibake:", found.length);
  for (const f of found) {
    console.log(f.t + "." + f.c + " (id=" + f.id + ") =>", JSON.stringify(f.v).substring(0, 200));
  }
  await c.end();
})().catch(e => { console.error("ERRO:", e.message); process.exit(1); });
