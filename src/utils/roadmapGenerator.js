const baseTopics = [
  { topic: "Programming Fundamentals", priority: "HIGH", minutes: 45 },
  { topic: "Arrays", priority: "HIGH", minutes: 45 },
  { topic: "Strings", priority: "HIGH", minutes: 40 },
  { topic: "OOP", priority: "MEDIUM", minutes: 45 },
  { topic: "HashMap", priority: "HIGH", minutes: 45 },
  { topic: "SQL", priority: "MEDIUM", minutes: 45 },
  { topic: "Coding Practice", priority: "HIGH", minutes: 60 },
  { topic: "Company Questions", priority: "HIGH", minutes: 50 },
  { topic: "Mock Interview", priority: "HIGH", minutes: 45 },
  { topic: "Revision & Weak Topics", priority: "MEDIUM", minutes: 45 }
];

export function generateRoadmap({ company, role, experience, interviewDate, preparationHours, skills = [] }) {
  const detectedTopics = skills
    .filter((skill) => !["Soft Skills"].includes(skill.category))
    .map((skill) => ({ topic: skill.name, priority: skill.priority, minutes: 45 }));

  const unique = [];
  [...detectedTopics, ...baseTopics].forEach((item) => {
    if (!unique.some((existing) => existing.topic.toLowerCase() === item.topic.toLowerCase())) {
      unique.push(item);
    }
  });

  const hours = Number(preparationHours) || 1;
  const interview = new Date(`${interviewDate}T00:00:00`);
  const days = Number.isNaN(interview.getTime())
    ? 14
    : Math.max(1, Math.ceil((interview.getTime() - Date.now()) / 86400000));

  const count = Math.max(4, Math.min(unique.length, Math.round(hours * days / 3)));
  const selected = unique.slice(0, count);
  const weeks = Math.max(1, Math.ceil(days / 7));

  return {
    meta: { company, role, experience, interviewDate, preparationHours },
    weeks: Array.from({ length: Math.min(weeks, 6) }, (_, index) => ({
      week: index + 1,
      title: index === 0 ? "Foundation & Priority Skills" : index === weeks - 1 ? "Mock Interview & Revision" : `Focused Preparation ${index + 1}`,
      items: selected
        .filter((_, itemIndex) => itemIndex % Math.min(weeks, 6) === index)
        .map((item, itemIndex) => ({
          id: `r-${index}-${item.topic.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${itemIndex}`,
          topic: item.topic,
          priority: item.priority,
          minutes: item.minutes,
          status: "not-started"
        }))
    })).filter((week) => week.items.length)
  };
}