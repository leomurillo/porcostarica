// Render language-specific pages from the homepage markup and the app's translations.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import words from "./docs/translations.mjs";

const root = new URL("./docs/", import.meta.url);
const template = await readFile(new URL("index.html", root), "utf8");
const escape = text => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
for (const [language, t] of Object.entries(words)) {
  const directory = new URL(language + "/", root);
  const html = template
    .replace('<html lang="es">', `<html lang="${language}" data-language="${language}">`)
    .replace(/<title>.*?<\/title>/, `<title>${escape(t.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, "$1" + escape(t.intro))
    .replace('rel="canonical" href="https://porcostarica.com/"', `rel="canonical" href="https://porcostarica.com/${language}/"`)
    .replace(/(data-t="(\w+)">)[^<]*/g, (_, opening, key) => opening + escape(t[key]));
  await mkdir(directory, {recursive:true});
  await writeFile(new URL("index.html", directory), html);
}
