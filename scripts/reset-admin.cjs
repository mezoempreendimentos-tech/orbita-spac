// One-shot: reseta o admin local. Deleta o usuário com email igual ao
// LOCAL_ADMIN_EMAIL — o seed do servidor recria na próxima chamada a
// /api/auth/local/login com a senha atual do env.
// CUIDADO: se houver FK constraints, o DELETE pode falhar com erro de
// integridade referencial. Nesse caso, desabilite as FKs temporariamente:
//   SET FOREIGN_KEY_CHECKS=0;
// Rode com: node scripts/reset-admin.cjs
const mysql = require("mysql2/promise");

const email = (process.env.LOCAL_ADMIN_EMAIL || "mezoempreendimentos@gmail.com").toLowerCase();
const url = process.env.DATABASE_URL || "mysql://orbita:06464ae5cdf614aae10949d7e32b456b@127.0.0.1:3306/orbita";
const m = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:/]+):(\d+)\/(.+)/);
if (!m) { console.error("DATABASE_URL inválida:", url); process.exit(1); }
const [, user, password, host, port, database] = m;

async function main() {
  const conn = await mysql.createConnection({ host, port: Number(port), user, password, database });
  try {
    const [before] = await conn.query("SELECT id, email, role FROM users WHERE email = ?", [email]);
    console.log("antes:", JSON.stringify(before));
    const [r] = await conn.query("DELETE FROM users WHERE email = ?", [email]);
    console.log("removido:", r.affectedRows, "linha(s)");
    const [after] = await conn.query("SELECT id, email FROM users WHERE email = ?", [email]);
    console.log("depois:", JSON.stringify(after));
  } finally {
    await conn.end();
  }
}

main().catch(e => { console.error("ERRO:", e.message); process.exit(1); });
