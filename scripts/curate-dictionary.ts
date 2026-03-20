/**
 * Dictionary Curation Script
 *
 * Uses the ENABLE word list (public domain Scrabble dictionary) as the
 * base, then outputs two tiers per word length:
 *   - words-{N}.json — all valid words (for player input validation)
 *   - common-{N}.json — common everyday words (for puzzle generation)
 *
 * The common words lists are hardcoded to ensure puzzle quality.
 * Every word on a puzzle's optimal path must be "common".
 *
 * Usage: npm run generate:dictionary
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// ENABLE word list — public domain, standard Scrabble dictionary (~173K words)
const WORD_LIST_URL =
  "https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt";

const OUT_DIR = join(process.cwd(), "public", "data");

// Words to exclude (offensive, slurs, etc.)
const BLOCKLIST = new Set([
  "arse", "crap", "damn", "dumb", "fags", "hell", "homo",
  "japs", "kike", "mong", "paki", "piss", "slag", "slut",
  "spaz", "tits", "turd", "twat", "wank", "coon", "dyke",
  "gook", "gypo", "niga", "rape", "spic", "wops", "anal",
  "anus", "clit", "cock", "cunt", "dick", "dildo", "orgy",
  "porn", "pube", "sexy", "smut",
]);

/**
 * Curated common words — everyday English that anyone would recognise.
 * These are used for puzzle endpoints and optimal paths.
 * Players can still TYPE any valid word from the full dictionary.
 */
const COMMON_3 = new Set([
  "ace", "act", "add", "age", "ago", "aid", "aim", "air", "all", "and",
  "ant", "any", "ape", "arc", "are", "ark", "arm", "art", "ash", "ask",
  "ate", "awe", "axe", "bad", "bag", "ban", "bar", "bat", "bay", "bed",
  "bee", "bet", "bid", "big", "bin", "bit", "bog", "bow", "box", "boy",
  "bud", "bug", "bun", "bus", "but", "buy", "cab", "can", "cap", "car",
  "cat", "cop", "cot", "cow", "cry", "cub", "cup", "cur", "cut", "dab",
  "dad", "dam", "day", "den", "dew", "did", "dig", "dim", "din", "dip",
  "doe", "dog", "dot", "dry", "dub", "dud", "due", "dug", "dun", "duo",
  "dye", "ear", "eat", "eel", "egg", "ego", "elm", "end", "era", "eve",
  "ewe", "eye", "fad", "fan", "far", "fat", "fax", "fed", "fee", "few",
  "fig", "fin", "fir", "fit", "fix", "fly", "foe", "fog", "for", "fox",
  "fry", "fun", "fur", "gag", "gal", "gap", "gas", "gel", "gem", "get",
  "gin", "god", "got", "gum", "gun", "gut", "guy", "gym", "had", "ham",
  "has", "hat", "hay", "hen", "her", "hew", "hid", "him", "hip", "his",
  "hit", "hog", "hop", "hot", "how", "hub", "hue", "hug", "hum", "hut",
  "ice", "icy", "ill", "imp", "ink", "inn", "ion", "ire", "irk", "its",
  "ivy", "jab", "jag", "jam", "jar", "jaw", "jay", "jet", "jig", "job",
  "jog", "jot", "joy", "jug", "jut", "keg", "ken", "key", "kid", "kin",
  "kit", "lab", "lad", "lag", "lap", "law", "lay", "lea", "led", "leg",
  "let", "lid", "lie", "lip", "lit", "log", "lot", "low", "lug", "mad",
  "man", "map", "mar", "mat", "maw", "max", "may", "men", "met", "mid",
  "mix", "mob", "mod", "mop", "mow", "mud", "mug", "mum", "nab", "nag",
  "nap", "net", "new", "nil", "nip", "nit", "nod", "nor", "not", "now",
  "nun", "nut", "oak", "oar", "oat", "odd", "ode", "off", "oft", "oil",
  "old", "one", "opt", "orb", "ore", "our", "out", "owe", "owl", "own",
  "pad", "pal", "pan", "par", "pat", "paw", "pay", "pea", "peg", "pen",
  "pep", "per", "pet", "pie", "pig", "pin", "pit", "ply", "pod", "pop",
  "pot", "pow", "pro", "pry", "pub", "pug", "pun", "pup", "put", "rag",
  "ram", "ran", "rap", "rat", "raw", "ray", "red", "ref", "rib", "rid",
  "rig", "rim", "rip", "rob", "rod", "rot", "row", "rub", "rug", "rum",
  "run", "rut", "rye", "sac", "sad", "sag", "sap", "sat", "saw", "say",
  "sea", "set", "sew", "she", "shy", "sin", "sip", "sir", "sit", "six",
  "ski", "sky", "sly", "sob", "sod", "son", "sop", "sot", "sow", "soy",
  "spa", "spy", "sty", "sub", "sue", "sum", "sun", "sup", "tab", "tad",
  "tag", "tan", "tap", "tar", "tax", "tea", "ten", "the", "thy", "tic",
  "tie", "tin", "tip", "toe", "ton", "too", "top", "tot", "tow", "toy",
  "try", "tub", "tug", "two", "urn", "use", "van", "vat", "vet", "vex",
  "via", "vie", "vim", "vow", "wad", "wag", "war", "was", "wax", "way",
  "web", "wed", "wet", "who", "why", "wig", "win", "wit", "woe", "wok",
  "won", "woo", "wow", "yak", "yam", "yap", "yaw", "yea", "yes", "yet",
  "yew", "you", "zap", "zed", "zen", "zip", "zoo",
]);

const COMMON_4 = new Set([
  "able", "ache", "acid", "acre", "aged", "aide", "arch", "area", "army",
  "auto", "away", "back", "bail", "bait", "bake", "bald", "bale", "ball",
  "band", "bane", "bang", "bank", "bare", "bark", "barn", "base", "bath",
  "bead", "beak", "beam", "bean", "bear", "beat", "beef", "been", "beer",
  "bell", "belt", "bend", "bent", "best", "bike", "bill", "bind", "bird",
  "bite", "blew", "blow", "blue", "blur", "boar", "boat", "body", "bold",
  "bolt", "bomb", "bond", "bone", "book", "boom", "boot", "bore", "born",
  "boss", "both", "bout", "bowl", "bred", "brew", "buck", "bulb", "bulk",
  "bull", "bump", "bunk", "burn", "bust", "busy", "buzz", "cage", "cake",
  "calf", "call", "calm", "came", "camp", "cane", "cape", "card", "care",
  "cart", "case", "cash", "cast", "cave", "chat", "chef", "chin", "chip",
  "chop", "city", "clad", "clam", "clap", "claw", "clay", "clip", "clod",
  "clog", "clue", "coal", "coat", "code", "coil", "coin", "cold", "colt",
  "comb", "come", "cone", "cook", "cool", "cope", "copy", "cord", "core",
  "cork", "corn", "cost", "cosy", "coup", "cove", "crab", "crew", "crop",
  "crow", "cube", "cult", "curb", "cure", "curl", "cute", "dale", "dame",
  "damp", "dare", "dark", "darn", "dart", "dash", "data", "date", "dawn",
  "dead", "deaf", "deal", "dean", "dear", "debt", "deck", "deed", "deem",
  "deep", "deer", "dent", "deny", "desk", "dial", "dice", "diet", "dirt",
  "disc", "dish", "disk", "dock", "does", "dome", "done", "doom", "door",
  "dose", "down", "doze", "drag", "draw", "drew", "drip", "drop", "drum",
  "dual", "duck", "duel", "duke", "dull", "dumb", "dump", "dune", "dung",
  "dunk", "dusk", "dust", "duty", "each", "earl", "earn", "ease", "east",
  "easy", "edge", "else", "emit", "envy", "epic", "even", "ever", "evil",
  "exam", "exit", "eyed", "face", "fact", "fade", "fail", "fair", "fake",
  "fall", "fame", "fang", "fare", "farm", "fast", "fate", "fawn", "fear",
  "feat", "feed", "feel", "feet", "fell", "felt", "fern", "file", "fill",
  "film", "find", "fine", "fire", "firm", "fish", "fist", "five", "flag",
  "flat", "flaw", "fled", "flew", "flip", "flit", "flog", "flow", "foam",
  "foil", "fold", "folk", "fond", "font", "food", "fool", "foot", "ford",
  "fore", "fork", "form", "fort", "foul", "four", "free", "frog", "from",
  "fuel", "full", "fume", "fund", "furl", "fury", "fuse", "fuss", "gain",
  "gale", "game", "gang", "gape", "garb", "gash", "gate", "gave", "gaze",
  "gear", "gift", "gild", "gill", "girl", "give", "glad", "glen", "glow",
  "glue", "glum", "gnat", "gnaw", "goat", "goes", "gold", "golf", "gone",
  "good", "gore", "gown", "grab", "gram", "gray", "grew", "grey", "grid",
  "grim", "grin", "grip", "grit", "grow", "grub", "gulf", "gull", "gust",
  "guts", "hack", "hail", "hair", "hale", "half", "hall", "halt", "hand",
  "hang", "hard", "hare", "harm", "harp", "hash", "hate", "haul", "have",
  "hawk", "haze", "hazy", "head", "heal", "heap", "hear", "heat", "heed",
  "heel", "held", "helm", "help", "herb", "herd", "here", "hero", "hide",
  "high", "hike", "hill", "hilt", "hind", "hint", "hire", "hold", "hole",
  "holy", "home", "hood", "hook", "hope", "horn", "hose", "host", "hour",
  "howl", "huge", "hull", "hung", "hunt", "hurl", "hurt", "hush", "hymn",
  "icon", "idea", "idle", "inch", "info", "into", "iron", "isle", "item",
  "jack", "jade", "jail", "jazz", "jean", "jeer", "jest", "jilt", "jobs",
  "join", "joke", "jolt", "jump", "junk", "jury", "just", "keen", "keep",
  "kelp", "kept", "kick", "kill", "kind", "king", "kiss", "kite", "knack",
  "knee", "knew", "knit", "knob", "knot", "know", "lace", "lack", "laid",
  "lake", "lamb", "lame", "lamp", "land", "lane", "lark", "lash", "last",
  "late", "lawn", "lead", "leaf", "leak", "lean", "leap", "left", "lend",
  "lens", "less", "liar", "lick", "life", "lift", "like", "limb", "lime",
  "limp", "line", "link", "lint", "lion", "list", "live", "load", "loaf",
  "loan", "lock", "loft", "logo", "lone", "long", "look", "loom", "loop",
  "lord", "lore", "lose", "loss", "lost", "loud", "love", "luck", "lump",
  "lung", "lure", "lurk", "lush", "lust", "made", "mail", "main", "make",
  "male", "mall", "malt", "mane", "many", "mare", "mark", "mask", "mass",
  "mast", "mate", "maze", "meal", "mean", "meat", "meet", "meld", "melt",
  "memo", "mend", "menu", "mere", "mesh", "mess", "mild", "mile", "milk",
  "mill", "mind", "mine", "mint", "miss", "mist", "moan", "moat", "mock",
  "mode", "mold", "mole", "molt", "monk", "mood", "moon", "moor", "more",
  "moss", "most", "moth", "move", "much", "muck", "mule", "murk", "muse",
  "mush", "must", "mute", "myth", "nail", "name", "near", "neat", "neck",
  "need", "nest", "news", "next", "nice", "nine", "node", "none", "noon",
  "norm", "nose", "note", "noun", "nude", "oath", "obey", "odds", "omen",
  "once", "only", "onto", "ooze", "open", "oral", "ours", "oust", "oven",
  "over", "owed", "pace", "pack", "pact", "page", "paid", "pail", "pain",
  "pair", "pale", "palm", "pane", "pang", "park", "part", "pass", "past",
  "path", "pave", "pawn", "peak", "peal", "pear", "peat", "peck", "peel",
  "peer", "perk", "pest", "pick", "pier", "pile", "pill", "pine", "pink",
  "pipe", "plan", "play", "plea", "plow", "ploy", "plum", "plug", "plum",
  "plus", "pock", "poem", "poet", "poke", "pole", "poll", "pond", "pony",
  "pool", "poor", "pope", "pore", "pork", "port", "pose", "post", "pour",
  "pray", "prep", "prey", "prod", "prop", "pros", "prow", "pull", "pulp",
  "pump", "pure", "push", "quit", "quiz", "race", "rack", "raft", "rage",
  "raid", "rail", "rain", "rake", "ramp", "rang", "rank", "rare", "rash",
  "rate", "rave", "read", "real", "reap", "rear", "reed", "reef", "reel",
  "rein", "rely", "rent", "rest", "rice", "rich", "ride", "rile", "rill",
  "rind", "ring", "ripe", "rise", "risk", "road", "roam", "roar", "robe",
  "rock", "rode", "role", "roll", "roof", "room", "root", "rope", "rose",
  "rote", "rout", "rove", "rude", "ruin", "rule", "rung", "rush", "rust",
  "safe", "sage", "said", "sail", "sake", "sale", "salt", "same", "sand",
  "sane", "sang", "sank", "sash", "save", "seal", "seam", "sear", "seat",
  "seed", "seek", "seem", "seen", "self", "sell", "send", "sent", "sewn",
  "shed", "shin", "ship", "shoe", "shoo", "shop", "shot", "show", "shut",
  "sick", "side", "sift", "sigh", "sign", "silk", "sill", "silt", "sing",
  "sink", "site", "size", "skin", "skip", "skit", "slab", "slam", "slap",
  "sled", "slew", "slid", "slim", "slip", "slit", "slob", "slot", "slow",
  "slug", "slum", "smog", "snap", "snip", "snob", "snow", "snub", "snug",
  "soak", "soap", "soar", "sock", "soda", "sofa", "soft", "soil", "sold",
  "sole", "some", "song", "soon", "soot", "sore", "sort", "soul", "sour",
  "span", "spar", "spec", "sped", "spin", "spit", "spot", "spun", "spur",
  "stab", "star", "stay", "stem", "step", "stew", "stir", "stop", "stub",
  "stud", "stun", "such", "suit", "sulk", "sung", "sunk", "sure", "surf",
  "swan", "swap", "swim", "swum", "tack", "tact", "tail", "take", "tale",
  "talk", "tall", "tame", "tang", "tank", "tape", "tart", "task", "taxi",
  "team", "tear", "teem", "tell", "tend", "tent", "term", "test", "text",
  "than", "that", "them", "then", "they", "thin", "this", "thud", "thus",
  "tick", "tide", "tidy", "tied", "tier", "tile", "till", "tilt", "time",
  "tine", "tiny", "tire", "toad", "toil", "told", "toll", "tomb", "tone",
  "took", "tool", "tops", "tore", "torn", "toss", "tour", "town", "trap",
  "tray", "tree", "trek", "trim", "trio", "trip", "trod", "trot", "true",
  "tube", "tuck", "tuft", "tuna", "tune", "turf", "turn", "tusk", "twig",
  "twin", "type", "ugly", "undo", "unit", "unto", "upon", "urge", "used",
  "user", "vain", "vale", "vane", "vary", "vast", "veil", "vein", "vent",
  "verb", "very", "vest", "veto", "vice", "view", "vine", "void", "vole",
  "volt", "vote", "wade", "wage", "wail", "wait", "wake", "walk", "wall",
  "wand", "want", "ward", "warm", "warn", "warp", "wart", "wary", "wash",
  "wasp", "wave", "wavy", "waxy", "weak", "wean", "wear", "weed", "week",
  "weld", "well", "welt", "went", "were", "west", "what", "when", "whim",
  "whip", "whom", "wick", "wide", "wife", "wild", "will", "wilt", "wily",
  "wimp", "wind", "wine", "wing", "wink", "wipe", "wire", "wise", "wish",
  "wisp", "with", "woke", "wolf", "womb", "wood", "wool", "word", "wore",
  "work", "worm", "worn", "wove", "wrap", "wren", "yank", "yard", "yarn",
  "year", "yell", "yoga", "yoke", "your", "zeal", "zero", "zinc", "zone",
  "zoom",
]);

const COMMON_5 = new Set([
  "about", "above", "abuse", "acted", "acute", "admit", "adopt", "adult",
  "after", "again", "agent", "agree", "ahead", "alarm", "alien", "align",
  "alike", "alive", "alley", "allow", "alone", "along", "alter", "ample",
  "angel", "anger", "angle", "ankle", "apart", "apple", "apply", "arena",
  "arise", "armor", "array", "aside", "asset", "atlas", "avoid", "awake",
  "award", "aware", "awful", "badge", "badly", "baker", "basic", "basin",
  "basis", "batch", "beach", "beard", "beast", "begin", "being", "below",
  "bench", "berry", "birth", "black", "blade", "blame", "bland", "blank",
  "blast", "blaze", "bleak", "bleed", "blend", "bless", "blind", "blink",
  "bliss", "block", "blood", "bloom", "blown", "blues", "bluff", "blunt",
  "blush", "board", "boast", "bonus", "booth", "bound", "brace", "brain",
  "brake", "brand", "brass", "brave", "bread", "break", "breed", "brick",
  "bride", "brief", "bring", "brink", "broad", "broil", "broke", "brook",
  "broom", "broth", "brown", "brush", "brute", "budge", "build", "built",
  "bulge", "bunch", "burst", "cabin", "cable", "camel", "candy", "carry",
  "catch", "cause", "cease", "chain", "chair", "chalk", "chant", "charm",
  "chart", "chase", "cheap", "cheat", "check", "cheek", "cheer", "chess",
  "chest", "chief", "child", "chill", "china", "chose", "chunk", "civic",
  "civil", "claim", "clamp", "clash", "clasp", "class", "clean", "clear",
  "clerk", "cliff", "climb", "cling", "cloak", "clock", "clone", "close",
  "cloth", "cloud", "clown", "clump", "coach", "coast", "color", "comic",
  "coral", "count", "couch", "could", "court", "cover", "crack", "craft",
  "crane", "crash", "crawl", "craze", "crazy", "creak", "cream", "creek",
  "creep", "crest", "crime", "crisp", "cross", "crowd", "crown", "crude",
  "cruel", "crush", "crust", "curve", "cycle", "daily", "dance", "death",
  "debug", "decay", "decoy", "delay", "demon", "dense", "depth", "derby",
  "devil", "diary", "dirty", "dizzy", "dodge", "doing", "donor", "doubt",
  "dough", "draft", "drain", "drake", "drama", "drank", "drape", "drawn",
  "dread", "dream", "dress", "dried", "drift", "drill", "drink", "drive",
  "drone", "drool", "droop", "drops", "drown", "drunk", "dying", "eager",
  "eagle", "early", "earth", "eight", "elder", "elect", "elite", "empty",
  "enemy", "enjoy", "enter", "equal", "equip", "erase", "error", "essay",
  "event", "every", "exact", "exile", "exist", "extra", "fable", "facet",
  "faint", "fairy", "faith", "false", "fancy", "fatal", "fault", "favor",
  "feast", "fence", "ferry", "fewer", "fiber", "field", "fifth", "fifty",
  "fight", "final", "first", "fixed", "flame", "flank", "flare", "flash",
  "flask", "fleet", "flesh", "flick", "fling", "flint", "float", "flock",
  "flood", "floor", "flora", "flour", "fluid", "flunk", "flush", "flute",
  "focal", "foggy", "force", "forge", "forth", "forty", "forum", "fossil",
  "found", "frame", "frank", "fraud", "fresh", "front", "frost", "froze",
  "fruit", "fully", "funny", "ghost", "giant", "given", "gland", "glare",
  "glass", "gleam", "glide", "globe", "gloom", "glory", "gloss", "glove",
  "going", "grace", "grade", "grain", "grand", "grant", "grape", "graph",
  "grasp", "grass", "grate", "grave", "gravy", "great", "greed", "green",
  "greet", "grief", "grill", "grind", "groan", "groin", "groom", "grope",
  "gross", "group", "grove", "growl", "grown", "guard", "guess", "guide",
  "guilt", "guise", "gulch", "gully", "gust", "habit", "handy", "happy",
  "harsh", "haste", "hasty", "hatch", "haunt", "haven", "heart", "heavy",
  "hedge", "hence", "herbs", "hinge", "hobby", "honor", "horse", "hotel",
  "hound", "house", "human", "humor", "humps", "hurry", "hyper", "ideal",
  "image", "imply", "inbox", "index", "inner", "input", "irony", "issue",
  "ivory", "jewel", "joint", "joker", "jolly", "judge", "juice", "juicy",
  "jumbo", "jumps", "kayak", "kebab", "khaki", "knack", "knead", "kneel",
  "knelt", "knife", "knock", "known", "label", "labor", "lance", "large",
  "laser", "latch", "later", "laugh", "layer", "leach", "learn", "lease",
  "least", "leave", "ledge", "legal", "lemon", "level", "lever", "light",
  "liken", "limit", "linen", "liver", "local", "lodge", "logic", "login",
  "loose", "lover", "lower", "loyal", "lucky", "lunar", "lunch", "lunge",
  "lying", "magic", "major", "maker", "manor", "maple", "march", "marry",
  "marsh", "match", "mayor", "media", "mercy", "merge", "merit", "merry",
  "metal", "meter", "might", "minor", "minus", "model", "money", "month",
  "moral", "motif", "motor", "mound", "mount", "mourn", "mouse", "mouth",
  "movie", "muddy", "multi", "music", "nerve", "never", "night", "noble",
  "noise", "north", "notch", "noted", "novel", "nurse", "occur", "ocean",
  "offer", "often", "olive", "onset", "opera", "orbit", "order", "organ",
  "other", "ought", "outer", "owner", "oxide", "ozone", "paint", "panel",
  "panic", "paper", "party", "paste", "patch", "pause", "peace", "peach",
  "pearl", "penny", "perch", "phase", "phone", "photo", "piano", "piece",
  "pilot", "pinch", "pitch", "pixel", "pizza", "place", "plaid", "plain",
  "plane", "plank", "plant", "plate", "plaza", "plead", "pleat", "pluck",
  "plumb", "plume", "plump", "plunge","point", "polar", "pooch", "porch",
  "pouch", "pound", "power", "press", "price", "pride", "prime", "print",
  "prior", "prism", "prize", "probe", "prone", "proof", "proud", "prove",
  "prune", "pulse", "punch", "pupil", "puppy", "purse", "queen", "quest",
  "queue", "quick", "quiet", "quilt", "quirk", "quota", "quote", "radar",
  "radio", "raise", "rally", "ranch", "range", "rapid", "ratio", "reach",
  "react", "realm", "rebel", "reign", "relax", "reply", "rider", "ridge",
  "rifle", "right", "rigid", "rinse", "risky", "rival", "river", "roast",
  "robin", "robot", "rocky", "rogue", "rouge", "rough", "round", "route",
  "rover", "royal", "rugby", "ruler", "rumor", "rural", "saint", "salad",
  "salon", "sauce", "scale", "scare", "scene", "scent", "scope", "score",
  "scout", "scrap", "screw", "sense", "serve", "seven", "shade", "shaft",
  "shake", "shall", "shame", "shape", "share", "shark", "sharp", "shave",
  "shawl", "sheep", "sheer", "sheet", "shelf", "shell", "shift", "shine",
  "shirt", "shock", "shore", "short", "shout", "shove", "shrub", "siege",
  "sight", "since", "sixth", "sixty", "skate", "skill", "skull", "slash",
  "slate", "slave", "sleep", "slept", "slice", "slide", "slope", "small",
  "smart", "smell", "smile", "smoke", "snack", "snail", "snake", "snare",
  "sneak", "solar", "solid", "solve", "sorry", "sound", "south", "space",
  "spare", "spark", "speak", "spear", "speed", "spell", "spend", "spice",
  "spike", "spine", "spite", "split", "spoke", "spoon", "sport", "spray",
  "squad", "stack", "staff", "stage", "stain", "stair", "stake", "stale",
  "stall", "stamp", "stand", "stare", "stark", "start", "state", "stave",
  "stays", "steak", "steal", "steam", "steel", "steep", "steer", "stern",
  "stick", "stiff", "still", "sting", "stink", "stock", "stoke", "stole",
  "stone", "stood", "stool", "stoop", "store", "stork", "storm", "story",
  "stove", "strap", "straw", "stray", "strip", "stuck", "study", "stuff",
  "stump", "stung", "stunk", "style", "sugar", "suite", "sunny", "super",
  "surge", "swamp", "swarm", "swear", "sweat", "sweep", "sweet", "swept",
  "swift", "swing", "swirl", "swore", "sworn", "swung", "table", "taste",
  "teach", "teeth", "tempo", "tense", "theme", "thick", "thief", "thing",
  "think", "third", "thorn", "those", "three", "threw", "throw", "thumb",
  "tiger", "tight", "timer", "tired", "title", "toast", "today", "token",
  "tooth", "topic", "total", "touch", "tough", "towel", "tower", "toxic",
  "trace", "track", "trade", "trail", "train", "trait", "trash", "treat",
  "trend", "trial", "tribe", "trick", "tried", "troop", "trout", "truck",
  "truly", "trump", "trunk", "trust", "truth", "tumor", "tweak", "twice",
  "twirl", "twist", "ultra", "uncle", "under", "union", "unite", "unity",
  "upper", "upset", "urban", "usage", "usual", "utter", "valid", "value",
  "vapor", "vault", "verse", "video", "vigor", "vinyl", "viral", "virus",
  "visit", "vital", "vivid", "vocal", "voice", "voter", "waist", "waste",
  "watch", "water", "weary", "weave", "wedge", "weigh", "weird", "whale",
  "wheat", "wheel", "where", "which", "while", "whine", "whirl", "white",
  "whole", "whose", "widen", "width", "witch", "woman", "world", "worry",
  "worse", "worst", "worth", "would", "wound", "wreck", "wring", "wrist",
  "write", "wrong", "wrote", "yacht", "yield", "young", "youth", "zebra",
]);

const COMMON_WORDS: Record<number, Set<string>> = {
  3: COMMON_3,
  4: COMMON_4,
  5: COMMON_5,
};

async function main() {
  console.log("Fetching ENABLE word list...");
  const response = await fetch(WORD_LIST_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch word list: ${response.status}`);
  }

  const text = await response.text();
  const allWords = text
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0);

  console.log(`Fetched ${allWords.length} total words`);

  // Ensure output directory exists
  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
  }

  // Filter and output by word length
  for (const len of [3, 4, 5, 6]) {
    const words = allWords.filter((w) => {
      if (w.length !== len) return false;
      if (!/^[a-z]+$/.test(w)) return false;
      if (BLOCKLIST.has(w)) return false;
      return true;
    });
    words.sort();

    // Write full valid word list (for player input validation)
    const outPath = join(OUT_DIR, `words-${len}.json`);
    writeFileSync(outPath, JSON.stringify(words));
    console.log(`  words-${len}.json: ${words.length} valid words`);

    // Write common words list (for puzzle generation)
    const commonSet = COMMON_WORDS[len];
    if (commonSet) {
      // Filter common words to only those that exist in the ENABLE dictionary
      const commonWords = [...commonSet].filter((w) => words.includes(w)).sort();
      const commonPath = join(OUT_DIR, `common-${len}.json`);
      writeFileSync(commonPath, JSON.stringify(commonWords));
      console.log(`  common-${len}.json: ${commonWords.length} common words`);
    }
  }

  console.log("\n✓ Dictionary curation complete!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
