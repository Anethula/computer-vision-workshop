import {
  defaults,
  ranges,
  colors,
  classes,
  initialSettings,
} from "./settings.js";
export function commandReference(lab) {
  const lines = ["help", "reset"];
  for (const [k, v] of Object.entries(defaults[lab])) {
    if (typeof v === "boolean") lines.push(`show ${k} on|off`);
    else if (k === "track") lines.push("track all|<COCO class>");
    else
      lines.push(
        `set ${k} ${k === "color" ? Object.keys(colors).join("|") : k === "difficulty" ? "easy|medium|hard" : `${ranges[k][0]}–${ranges[k][1]}`}`,
      );
  }
  if (lab === "gesture") lines.push("spawn circle|square", "clear objects");
  if (lab === "arcade") lines.push("start game", "pause game", "restart game");
  return lines;
}
export function parseCommand(line, lab) {
  const text = line.trim().toLowerCase();
  if (!text || text.startsWith("#")) return { type: "skip" };
  const parts = text.split(/\s+/);
  const [verb, key, ...rest] = parts;
  const value = rest.join(" ");
  if (["help", "reset"].includes(verb) && parts.length === 1)
    return { type: verb };
  if (
    verb === "set" &&
    parts.length === 3 &&
    Object.hasOwn(defaults[lab], key) &&
    typeof defaults[lab][key] !== "boolean" &&
    key !== "track"
  ) {
    if (key === "color") {
      if (!Object.hasOwn(colors, value))
        throw Error(`Choose a color: ${Object.keys(colors).join(", ")}.`);
      return { type: "set", key, value };
    }
    if (key === "difficulty") {
      if (!["easy", "medium", "hard"].includes(value))
        throw Error("Difficulty must be easy, medium, or hard.");
      return { type: "set", key, value };
    }
    const n = Number(value),
      [min, max] = ranges[key];
    if (!Number.isFinite(n) || n < min || n > max)
      throw Error(`${key} must be a number from ${min} to ${max}.`);
    if (["smoothing", "lives"].includes(key) && !Number.isInteger(n))
      throw Error(`${key} must be a whole number.`);
    return { type: "set", key, value: n };
  }
  if (
    verb === "show" &&
    parts.length === 3 &&
    typeof defaults[lab][key] === "boolean"
  ) {
    if (!["on", "off"].includes(value))
      throw Error(`Use show ${key} on or show ${key} off.`);
    return { type: "set", key, value: value === "on" };
  }
  if (verb === "track" && lab === "object") {
    const target = parts.slice(1).join(" ");
    if (target !== "all" && !classes.includes(target))
      throw Error(
        "Use track all or a COCO class such as bottle, person, or cell phone.",
      );
    return { type: "set", key: "track", value: target };
  }
  if (
    lab === "gesture" &&
    verb === "spawn" &&
    parts.length === 2 &&
    ["circle", "square"].includes(key)
  )
    return { type: "spawn", shape: key };
  if (lab === "gesture" && text === "clear objects") return { type: "clear" };
  if (
    lab === "arcade" &&
    ["start game", "pause game", "restart game"].includes(text)
  )
    return { type: verb };
  throw Error(
    `Unknown command. Try ${commandReference(lab).find((c) => c.startsWith(verb)) || "help"}; commands are specific to this lab.`,
  );
}
export function applyCommand(settings, command, lab) {
  if (command.type === "reset") {
    Object.keys(settings).forEach((k) => delete settings[k]);
    Object.assign(settings, initialSettings(lab));
  }
  if (command.type === "set") {
    settings[command.key] = command.value;
    if (command.key === "difficulty")
      Object.assign(settings, {
        ball_speed: { easy: 2, medium: 4, hard: 7 }[command.value],
        paddle_width: { easy: 160, medium: 120, hard: 80 }[command.value],
      });
  }
  return settings;
}
