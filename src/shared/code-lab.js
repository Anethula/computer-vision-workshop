import { defaults } from "./settings.js";
import { parseCommand } from "./commands.js";

export function starterCode(lab, settings) {
  return "// Edit numbers, then apply and observe the live output.\n" +
    Object.entries(settings).filter(([, value]) => typeof value === "number")
      .map(([key, value]) => `const ${key} = ${value};`).join("\n");
}

// Parse a deliberately small JavaScript subset; never execute arbitrary code.
export function codeCommands(source, lab) {
  const commands = [];
  const seen = new Set();
  source.split("\n").forEach((line, index) => {
    const text = line.replace(/\/\/.*$/, "").trim();
    if (!text) return;
    const match = text.match(/^const\s+([a-z_]+)\s*=\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*;?$/);
    if (!match) throw Error(`Line ${index + 1}: use const setting_name = number;`);
    const [, key, value] = match;
    if (typeof defaults[lab][key] !== "number")
      throw Error(`Line ${index + 1}: ${key} is not a numeric setting for this lab.`);
    if (seen.has(key)) throw Error(`Line ${index + 1}: duplicate declaration for ${key}.`);
    seen.add(key);
    const command = `set ${key} ${value}`;
    parseCommand(command, lab);
    commands.push(command);
  });
  if (!commands.length) throw Error("Add at least one numeric const declaration.");
  return commands.join("\n");
}
