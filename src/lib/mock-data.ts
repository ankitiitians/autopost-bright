export type Platform = "linkedin" | "instagram" | "both";
export type PostStatus = "success" | "failed" | "pending";
export type LogLevel = "INFO" | "SUCCESS" | "ERROR" | "WARNING";

export interface Post {
  id: string;
  topic: string;
  platform: "linkedin" | "instagram";
  status: PostStatus;
  content: string;
  imageUrl?: string;
  errorMsg?: string;
  postedAt: Date;
}

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
}

const topics = [
  "Kubernetes automation", "Cloud computing careers", "AWS Lambda deep dive",
  "Linux performance tuning", "DevOps best practices in 2026", "AI tools for engineers",
  "Cybersecurity fundamentals", "Full-stack with Next.js", "Terraform IaC patterns",
  "Docker vs Podman", "Career growth in tech", "Observability and tracing",
  "GitOps workflows", "Serverless cost optimization",
];

const linkedinSample = (topic: string) =>
  `${topic} is reshaping how modern teams ship software.\n\nHere's what I've learned this week:\n\n→ Automate the boring parts first\n→ Invest in observability early\n→ Treat documentation as a first-class artifact\n\nThe teams that win are the ones that move with intention, not just speed.\n\nWhat's your take?\n\n#DevOps #CloudComputing #TechLeadership #Engineering`;

const instagramSample = (topic: string) =>
  `🚀 Let's talk ${topic} ✨\n\nThree things changed everything for me this week 👇\n\n1️⃣ Start small, ship often\n2️⃣ Measure what matters\n3️⃣ Share what you learn\n\nSave this for later 💾\n\n#tech #devops #coding #cloud #aws #kubernetes #engineering #developer #softwareengineer #automation #ai #career #linux #programming #devlife`;

export const mockPosts: Post[] = Array.from({ length: 14 }).map((_, i) => {
  const topic = topics[i % topics.length];
  const platform: "linkedin" | "instagram" = i % 2 === 0 ? "linkedin" : "instagram";
  const failed = i === 3 || i === 9;
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(i / 2));
  date.setHours(9, 0, 0, 0);
  return {
    id: `post-${i}`,
    topic,
    platform,
    status: failed ? "failed" : "success",
    content: platform === "linkedin" ? linkedinSample(topic) : instagramSample(topic),
    imageUrl: failed ? undefined : `https://picsum.photos/seed/${i}/600/600`,
    errorMsg: failed ? "Invalid access token — please reconnect your account" : undefined,
    postedAt: date,
  };
});

const baseTime = new Date();
baseTime.setHours(9, 0, 0, 0);

const logTemplate: Array<[LogLevel, string]> = [
  ["INFO", "Cron job triggered — daily automation starting"],
  ["INFO", "Fetching today's topic from GPT..."],
  ["SUCCESS", 'Topic selected: "Kubernetes automation"'],
  ["INFO", "Generating LinkedIn post..."],
  ["SUCCESS", "LinkedIn post generated (342 characters)"],
  ["INFO", "Generating Instagram caption..."],
  ["SUCCESS", "Instagram caption generated (198 characters)"],
  ["INFO", "Generating AI image via DALL·E 3..."],
  ["SUCCESS", "Image generated — saved to generated/img_20260521.png"],
  ["INFO", "Uploading image and posting to LinkedIn..."],
  ["SUCCESS", "LinkedIn post published successfully"],
  ["INFO", "Uploading image and posting to Instagram..."],
  ["SUCCESS", "Instagram post published successfully"],
  ["INFO", "Cleaning up temporary files..."],
  ["SUCCESS", "Daily automation complete — 2/2 posts published"],
];

export const mockLogs: LogEntry[] = [];
for (let run = 0; run < 4; run++) {
  logTemplate.forEach(([level, message], idx) => {
    const t = new Date(baseTime);
    t.setDate(t.getDate() - run);
    t.setSeconds(t.getSeconds() + idx * 2);
    mockLogs.push({
      id: `log-${run}-${idx}`,
      level: run === 1 && idx === 10 ? "ERROR" : level,
      message: run === 1 && idx === 10 ? "LinkedIn API returned 401 — token expired" : message,
      timestamp: t,
    });
  });
}
mockLogs.reverse();

export const topicCategories = [
  "DevOps", "Cloud Computing", "AWS", "Kubernetes", "Linux",
  "Career Growth", "Automation", "AI Tools", "Cyber Security", "Full Stack Development",
];

export const suggestTopic = () => topics[Math.floor(Math.random() * topics.length)];

export function genLinkedIn(topic: string, tone: string) {
  return `${topic} — a ${tone.toLowerCase()} perspective.\n\nThree things every engineer should know:\n\n→ Foundations matter more than frameworks\n→ Reliability is a feature, not an afterthought\n→ The best automation is invisible\n\nWhat would you add to this list?\n\n#${topic.replace(/\s+/g, "")} #DevOps #Engineering #TechLeadership`;
}

export function genInstagram(topic: string) {
  return `✨ ${topic} unlocked 🔓\n\nThree quick wins you can apply today 👇\n\n1️⃣ Automate one repetitive task\n2️⃣ Document as you build\n3️⃣ Ship small, ship often\n\nDouble tap if this helped 💜\n\n#tech #coding #devops #cloud #aws #kubernetes #linux #engineer #developer #automation #ai #career #softwareengineering #devlife #buildinpublic`;
}
