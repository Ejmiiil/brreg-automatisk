import fetch from "node-fetch";
import fs from "fs";

// ---- KONFIG ---- //
const kommunenummer = "0301";
const dato = "2026-02-06";

// Næringskoder du vil filtrere på
const naeringskoder = ["56.1", "56.11", "56.110", "56.300"];

// API-endepunkt
const apiUrl = `https://data.brreg.no/enhetsregisteret/api/enheter?kommunenummer=${kommunenummer}&underKonkursbehandling=false&fraRegistreringsdatoEnhetsregisteret=${dato}&size=1000`;

// ---- FUNKSJON ---- //
function matchesNaeringskode(code) {
  if (!code) return false;
  return naeringskoder.some(n => code.startsWith(n));
}

async function main() {
  console.log("Henter data fra BRREG...");

  const res = await fetch(apiUrl);
  const data = await res.json();

  const enheter = data._embedded?.enheter || [];

  console.log(`Hentet totalt ${enheter.length} enheter. Filtrerer...`);

  const filtrert = enheter.filter(e => {
    const nk = e.naeringskode1?.kode || "";
    return matchesNaeringskode(nk);
  });

  console.log(`Resultat etter filtrering: ${filtrert.length} treff.`);

  // Lagre JSON
  fs.writeFileSync(
    "filtered.json",
    JSON.stringify(filtrert, null, 2),
    "utf-8"
  );

  // Lagre CSV
  const csvHeader = "orgnr;navn;naeringskode;poststed;postnummer\n";
  const csvRows = filtrert
    .map(e => {
      const org = e.organisasjonsnummer || "";
      const navn = (e.navn || "").replace(/;/g, ",");
      const nk = e.naeringskode1?.kode || "";
      const postnummer = e.postadresse?.postnummer || "";
      const poststed = e.postadresse?.poststed || "";
      return `${org};${navn};${nk};${poststed};${postnummer}`;
    })
    .join("\n");

  fs.writeFileSync("filtered.csv", csvHeader + csvRows, "utf-8");

  console.log("Ferdig! Filene filtered.json og filtered.csv er oppdatert.");
}

main();
