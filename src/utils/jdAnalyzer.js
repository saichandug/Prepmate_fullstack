import { priorityByCategory, skillDictionary } from "../data/skills";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function containsAlias(text, alias) {
  if (alias.length <= 2) {
    return new RegExp(`(^|[^a-z0-9+#])${escapeRegExp(alias.trim())}([^a-z0-9+#]|$)`, "i").test(text);
  }
  return text.includes(alias.toLowerCase());
}

export function analyzeJD(input) {
  const text = String(input ?? "").trim();
  if (!text) return { status: "empty", message: "Job description is required." };
  if (text.length < 30) return { status: "short", message: "Job Description Too Short" };

  const normalized = text.toLowerCase();
  const detected = skillDictionary.filter((skill) =>
    skill.aliases.some((alias) => containsAlias(normalized, alias))
  );

  if (!detected.length) {
    return {
      status: "unrelated",
      message: "The entered text does not appear to contain software-job requirements. Please enter a relevant job description containing skills, responsibilities, or requirements.",
      skills: []
    };
  }

  const skills = detected.map((skill) => ({
    ...skill,
    priority: priorityByCategory[skill.category] || "LOW"
  }));

  return {
    status: skills.length <= 2 ? "limited" : "success",
    skills,
    categories: [...new Set(skills.map((skill) => skill.category))],
    keywords: skills.map((skill) => skill.name)
  };
}