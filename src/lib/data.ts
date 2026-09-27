// Seed data for the GopherHole prototype. Structured as if a backend will
// replace these files later (ids, stable shapes, no UI concerns).

export type HousingType =
  | "Dorm"
  | "Apartment"
  | "Subletting my place";

export type Intent = "Just a roommate" | "Roommate who could be a friend";

export type Neighborhood =
  | "Dinkytown"
  | "Superblock"
  | "Stadium Village"
  | "Como"
  | "Prospect Park"
  | "Downtown"
  | "St. Paul campus";

export interface PromptAnswer {
  prompt: string;
  answer: string;
}

export interface Student {
  id: string;
  name: string;
  pronouns: string;
  age: number;
  gender: string;
  year: "Freshman" | "Sophomore" | "Junior" | "Senior" | "Grad";
  classOf: string;
  major: string;
  hometown: string;
  housing: HousingType;
  neighborhoods: Neighborhood[];
  budgetMin: number;
  budgetMax: number;
  moveIn: string;
  parking: "Bringing a car" | "Need a spot" | "No car";
  cleanliness: "Very tidy" | "Pretty tidy" | "Lived-in";
  sleep: "Early bird" | "Night owl" | "Somewhere between";
  intent: Intent;
  hasRoommates: boolean;
  lookingForSubleaser: boolean;
  verified: boolean;
  lastActive: string;
  socials: { instagram?: string | undefined; snapchat?: string | undefined; tiktok?: string | undefined; linkedin?: string | undefined };
  spotify: { track: string; artist: string };
  prompts: PromptAnswer[];
  opener: string;
}

export const PROMPT_BANK = [
  "🍝 My signature 1am snack is…",
  "🧽 My cleaning style in three emojis",
  "🏈 Gameday at our place looks like…",
  "🔇 Quiet hours I will actually respect",
  "🛒 Shared groceries or labeled shelves?",
  "🚩 The roommate red flag I won't ignore again",
  "🎶 The song you'll hear through my door",
  "🥶 My take on the thermostat in January",
  "👯 Guests over: never / sometimes / a lot",
  "🏆 Clubs or teams I actually show up for",
  "☕ Morning me vs. night me",
  "🐿️ Most Minnesota thing about me",
]

export const TALKING_POINTS = [
  "You have different cleaning expectations. How would chores work?",
  "Would you share groceries or keep them separate?",
  "What requires permission before someone enters your room or borrows something?",
];

const first = [
  "Goldy", "Blarney", "Sally", "Alex", "Maya", "Jonah", "Priya", "Tate",
  "Nina", "Owen", "Hana", "Marcus", "Elle", "Diego", "Sam", "Ruth",
  "Kai", "Lena", "Cole", "Imani", "Beau", "Sofia", "Wes", "Anika",
];
const majors = [
  "CS", "Nursing", "Mech E", "Journalism", "Biology", "Finance", "Design",
  "Psychology", "Kinesiology", "Political Science", "Chemistry", "Marketing",
];
const homes = [
  "Edina, MN", "Duluth, MN", "Rochester, MN", "Chicago, IL", "Fargo, ND",
  "Maple Grove, MN", "Milwaukee, WI", "Sioux Falls, SD",
];
const hoods: Neighborhood[][] = [
  ["Dinkytown", "Stadium Village"],
  ["Superblock"],
  ["Stadium Village", "Prospect Park"],
  ["Como", "Dinkytown"],
  ["Downtown", "Stadium Village"],
  ["St. Paul campus", "Como"],
];
const housings: HousingType[] = [
  "Dorm", "Apartment", "Subletting my place", "Apartment", "Dorm", "Apartment",
];
const intents: Intent[] = [
  "Just a roommate",
  "Roommate who could be a friend",
  "Roommate who could be a friend",
  "Just a roommate",
];
const actives = [
  "online during lecture", "just left Pioneer dining", "up before 8am (respect)", "studying at Walter last night",
  "spotted at Coffman yesterday", "on a lake weekend", "hibernating since midterms", "crossing the Stone Arch rn",
];
const tracks = [
  { track: "Ski-U-Mah (Remix)", artist: "Marching Band" },
  { track: "Midwest Emo Hour", artist: "Hippo Campus" },
  { track: "Football Pod 1AM", artist: "Gopher Talk" },
  { track: "Kilby Girl", artist: "The Backseat Lovers" },
  { track: "Rich Baby Daddy", artist: "Drake" },
  { track: "Sweater Weather", artist: "The Neighbourhood" },
];
const openers = [
  "Ski-U-Mah! Let's connect soon",
  "Holy buckets! Are you from MN?",
  "Oh, yah! What dorm are you in?",
  "I'm pretty chill about most things",
  "Do you actually answer the group chat?",
  "Warning: I cook at midnight",
];

const customPrompts: Record<number, PromptAnswer[]> = {
  3: [
    { prompt: "The roommate red flag I will not ignore again", answer: "I found a roommate on Snapchat UMN story once. Never again." },
    { prompt: "Cleaning expectations in one sentence", answer: "Dishes same day, everything else is negotiable." },
    { prompt: "Quiet hours I will actually respect", answer: "Midnight on weekdays, all bets off on gamedays." },
  ],
  4: [
    { prompt: "Athletics / clubs I actually show up for", answer: "Club volleyball, 6am lifts, and every home game." },
    { prompt: "Long term open to short", answer: "I want a roommate who becomes a real friend." },
    { prompt: "My 2am grocery run is going to…", answer: "Target, and yes I will text you before I leave." },
  ],
  6: [
    { prompt: "Religion / spirituality, if it affects living together", answer: "I go to church Sunday mornings and host small group twice a month." },
    { prompt: "I have a partner who will be over: never / sometimes / a lot", answer: "Sometimes — weekends, and never unannounced." },
    { prompt: "Cleaning expectations in one sentence", answer: "Shared spaces spotless, my room is my business." },
  ],
};

export const STUDENTS: Student[] = first.map((name, i) => {
  const budgetMin = 500 + (i % 5) * 150;
  return {
    id: `s${i + 1}`,
    name,
    pronouns: i % 3 === 0 ? "he/him/his" : i % 3 === 1 ? "she/her/hers" : "they/them",
    age: 18 + (i % 5),
    gender: i % 3 === 0 ? "Man" : i % 3 === 1 ? "Woman" : "Nonbinary",
    year: (["Freshman", "Sophomore", "Junior", "Senior", "Grad"] as const)[i % 5]!,
    classOf: `Class of ${2027 + (i % 4)}`,
    major: majors[i % majors.length]!,
    hometown: homes[i % homes.length]!,
    housing: housings[i % housings.length]!,
    neighborhoods: hoods[i % hoods.length]!,
    budgetMin,
    budgetMax: budgetMin + 400,
    moveIn: i % 2 === 0 ? "Aug 2026" : "May 2026",
    parking: (["Bringing a car", "Need a spot", "No car"] as const)[i % 3]!,
    cleanliness: (["Very tidy", "Pretty tidy", "Lived-in"] as const)[i % 3]!,
    sleep: (["Night owl", "Early bird", "Somewhere between"] as const)[i % 3]!,
    intent: intents[i % intents.length]!,
    hasRoommates: i % 4 === 0,
    lookingForSubleaser: i % 6 === 0,
    verified: true,
    lastActive: actives[i % actives.length]!,
    socials: {
      instagram: `@${name.toLowerCase()}.umn`,
      snapchat: `${name.toLowerCase()}${20 + i}`,
      tiktok: i % 2 === 0 ? `@${name.toLowerCase()}tok` : undefined,
      linkedin: i % 3 === 0 ? `in/${name.toLowerCase()}-umn` : undefined,
    },
    spotify: tracks[i % tracks.length]!,
    prompts:
      customPrompts[i] ?? [
        { prompt: PROMPT_BANK[i % PROMPT_BANK.length]!, answer: "Ask me, I'm blunt about it." },
        { prompt: "Cleaning expectations in one sentence", answer: "Kitchen clean before bed, always." },
        { prompt: "Football Saturdays at my place sound like…", answer: "Loud until 4pm, then a nap." },
      ],
    opener: openers[i % openers.length]!,
  };
});

export interface Listing {
  id: string;
  title: string;
  posterId: string;
  pocket: string;
  rent: number;
  utilities: string;
  moveIn: string;
  moveOut: string;
  parking: string;
  existing: string;
  note: string;
}

export const LISTINGS: Listing[] = [
  {
    id: "l1",
    title: "Fieldhouse 2bed — need 1 subleaser May–August",
    posterId: "s1",
    pocket: "Stadium Village / Fieldhouse",
    rent: 1045,
    utilities: "≈ $60/mo utilities, internet included",
    moveIn: "May 15, 2026",
    moveOut: "Aug 20, 2026",
    parking: "Garage spot available for $120/mo",
    existing: "1 existing roommate (junior, Mech E)",
    note: "Existing roommates want someone who actually answers the group chat.",
  },
  {
    id: "l2",
    title: "Dinkytown house — open room for fall",
    posterId: "s7",
    pocket: "Dinkytown",
    rent: 720,
    utilities: "≈ $45/mo split four ways",
    moveIn: "Sep 1, 2026",
    moveOut: "Aug 31, 2027",
    parking: "Street parking only",
    existing: "3 existing roommates",
    note: "We cook a lot and clean on Sundays. Please be normal.",
  },
  {
    id: "l3",
    title: "Superblock double — swap into Territorial",
    posterId: "s13",
    pocket: "Superblock",
    rent: 640,
    utilities: "Included in housing contract",
    moveIn: "Jan 10, 2027",
    moveOut: "May 2027",
    parking: "No car",
    existing: "Dorm double, one current occupant",
    note: "Spring semester only. Quiet floor, actual quiet hours.",
  },
];

export const NEIGHBORHOODS: Neighborhood[] = [
  "Dinkytown", "Superblock", "Stadium Village", "Como", "Prospect Park", "Downtown", "St. Paul campus",
];

export const DORMS = [
  "Centennial Hall", "Comstock Hall", "Frontier Hall", "Pioneer Hall", "Territorial Hall",
  "Sanford Hall", "Middlebrook Hall", "17th Avenue Hall", "Yudof Hall", "Keeler Apartments",
  "Wilkins Hall", "Bailey Hall", "Roy Wilkins", "Comstock East", "University Village",
  "Radius (Dinkytown)", "Fieldhouse Apts", "Wall Street Tower", "Keeler",
];

export const MAJORS = [
  "Undeclared", "Accounting", "Aerospace E", "Anthropology", "Architecture", "Biology", "Biomedical E",
  "Business", "Chemical E", "Chemistry", "Civil E", "CS", "Data Science", "Design", "Economics",
  "Electrical E", "English", "Finance", "Graphic Design", "History", "Journalism", "Kinesiology",
  "Marketing", "Math", "Mech E", "Music", "Neuroscience", "Nursing", "Philosophy", "Physics",
  "Political Science", "Pre-med", "Psychology", "Sociology", "Statistics",
];

export const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","International",
];

export const MONTHS = (() => {
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const out: string[] = [];
  for (const y of [2026, 2027]) for (const m of names) out.push(`${m} ${y}`);
  return out;
})();
