/**
 * Puzzle Generator
 *
 * Generates 90 days of daily puzzles using BFS on the word graph.
 * Follows the weekly difficulty rotation:
 *   Mon-Thu: 4-letter (standard)
 *   Fri-Sat: 5-letter (advanced)
 *   Sunday:  3-letter (starter)
 *
 * Picks common words and prefers thematic pairs when available.
 *
 * Usage: npm run generate:puzzles
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "public", "data");

interface PuzzleEntry {
  id: number;
  date: string;
  startWord: string;
  targetWord: string;
  wordLength: number;
  par: number;
  optimalPath: string[];
  difficulty: string;
}

// Common words we prefer for puzzle endpoints (curated for familiarity)
const COMMON_WORDS_3 = new Set([
  "ace", "act", "add", "age", "ago", "aid", "aim", "air", "all", "and",
  "ant", "any", "ape", "arc", "are", "ark", "arm", "art", "ash", "ask",
  "ate", "awe", "axe", "bad", "bag", "ban", "bar", "bat", "bay", "bed",
  "bee", "bet", "bid", "big", "bin", "bit", "bog", "bow", "box", "boy",
  "bud", "bug", "bun", "bus", "but", "buy", "cab", "can", "cap", "car",
  "cat", "cop", "cow", "cry", "cub", "cup", "cut", "dad", "dam", "day",
  "den", "dew", "did", "dig", "dim", "dip", "dog", "dot", "dry", "dub",
  "dud", "due", "dug", "dun", "duo", "dye", "ear", "eat", "eel", "egg",
  "ego", "elm", "emu", "end", "era", "eve", "ewe", "eye", "fad", "fan",
  "far", "fat", "fax", "fed", "fee", "few", "fig", "fin", "fir", "fit",
  "fix", "fly", "foe", "fog", "for", "fox", "fry", "fun", "fur", "gag",
  "gal", "gap", "gas", "gel", "gem", "get", "gin", "gnu", "god", "got",
  "gum", "gun", "gut", "guy", "gym", "had", "ham", "has", "hat", "hay",
  "hen", "her", "hew", "hex", "hid", "him", "hip", "his", "hit", "hog",
  "hop", "hot", "how", "hub", "hue", "hug", "hum", "hut", "ice", "icy",
  "ill", "imp", "ink", "inn", "ion", "ire", "irk", "its", "ivy", "jab",
  "jag", "jam", "jar", "jaw", "jay", "jet", "jig", "job", "jog", "joy",
  "jug", "jut", "keg", "ken", "key", "kid", "kin", "kit", "lab", "lad",
  "lag", "lap", "law", "lay", "lea", "led", "leg", "let", "lid", "lie",
  "lip", "lit", "log", "lot", "low", "lug", "mad", "man", "map", "mar",
  "mat", "maw", "max", "may", "men", "met", "mid", "mix", "mob", "mod",
  "mop", "mow", "mud", "mug", "nab", "nag", "nap", "net", "new", "nil",
  "nip", "nit", "nod", "nor", "not", "now", "nun", "nut", "oak", "oar",
  "oat", "odd", "ode", "off", "oft", "oil", "old", "one", "opt", "orb",
  "ore", "our", "out", "owe", "owl", "own", "pad", "pal", "pan", "par",
  "pat", "paw", "pay", "pea", "peg", "pen", "pep", "per", "pet", "pie",
  "pig", "pin", "pit", "ply", "pod", "pop", "pot", "pow", "pro", "pry",
  "pub", "pug", "pun", "pup", "pus", "put", "rag", "ram", "ran", "rap",
  "rat", "raw", "ray", "red", "ref", "rev", "rib", "rid", "rig", "rim",
  "rip", "rob", "rod", "rot", "row", "rub", "rug", "rum", "run", "rut",
  "rye", "sac", "sad", "sag", "sap", "sat", "saw", "say", "sea", "set",
  "sew", "she", "shy", "sin", "sip", "sir", "sis", "sit", "six", "ski",
  "sky", "sly", "sob", "sod", "son", "sop", "sot", "sow", "soy", "spa",
  "spy", "sty", "sub", "sue", "sum", "sun", "sup", "tab", "tad", "tag",
  "tan", "tap", "tar", "tax", "tea", "ten", "the", "thy", "tic", "tie",
  "tin", "tip", "toe", "ton", "too", "top", "tow", "toy", "try", "tub",
  "tug", "two", "urn", "use", "van", "vat", "vet", "vex", "via", "vie",
  "vim", "vow", "wad", "wag", "war", "was", "wax", "way", "web", "wed",
  "wet", "who", "why", "wig", "win", "wit", "woe", "wok", "won", "woo",
  "wow", "yak", "yam", "yap", "yaw", "yea", "yes", "yet", "yew", "you",
  "zap", "zed", "zen", "zig", "zip", "zoo",
]);

const COMMON_WORDS_4 = new Set([
  "able", "acid", "aged", "also", "arch", "area", "army", "away",
  "back", "bake", "bald", "ball", "band", "bang", "bank", "bare",
  "bark", "barn", "base", "bath", "bead", "beak", "beam", "bean",
  "bear", "beat", "been", "beer", "bell", "belt", "bend", "best",
  "bike", "bill", "bind", "bird", "bite", "blew", "blow", "blue",
  "blur", "boat", "body", "bold", "bolt", "bomb", "bond", "bone",
  "book", "boot", "bore", "born", "boss", "both", "bowl", "bulk",
  "bull", "bump", "burn", "bury", "bush", "bust", "busy", "cage",
  "cake", "call", "calm", "came", "camp", "cane", "cape", "card",
  "care", "cart", "case", "cash", "cast", "cave", "chat", "chip",
  "city", "clap", "clay", "clip", "clue", "coal", "coat", "code",
  "coil", "coin", "cold", "cole", "colt", "come", "cone", "cook",
  "cool", "cope", "cord", "core", "cork", "corn", "cost", "cosy",
  "coup", "crew", "crop", "crow", "cube", "cult", "cure", "curl",
  "cute", "dale", "dame", "damp", "dare", "dark", "dart", "dash",
  "dawn", "dead", "deaf", "deal", "dean", "dear", "debt", "deck",
  "deed", "deem", "deep", "deer", "demo", "dent", "deny", "desk",
  "dial", "dice", "diet", "dirt", "disc", "dish", "disk", "dock",
  "does", "dome", "done", "doom", "door", "dose", "down", "draw",
  "drew", "drip", "drop", "drum", "dual", "duck", "duel", "duke",
  "dull", "dump", "dune", "dusk", "dust", "duty", "each", "earl",
  "earn", "ease", "east", "easy", "edge", "else", "emit", "envy",
  "epic", "euro", "even", "ever", "evil", "exam", "exit", "eyed",
  "face", "fact", "fade", "fail", "fair", "fake", "fall", "fame",
  "fang", "fare", "farm", "fast", "fate", "fear", "feat", "feed",
  "feel", "feet", "fell", "felt", "file", "fill", "film", "find",
  "fine", "fire", "firm", "fish", "fist", "five", "flag", "flat",
  "fled", "flew", "flip", "flog", "flow", "flux", "foam", "fold",
  "folk", "fond", "font", "food", "fool", "foot", "ford", "fore",
  "fork", "form", "fort", "foul", "four", "free", "from", "fuel",
  "full", "fund", "fury", "fuse", "fuss", "gain", "gale", "game",
  "gang", "gape", "garb", "gash", "gate", "gave", "gaze", "gear",
  "gift", "gild", "girl", "give", "glad", "glen", "glow", "glue",
  "goat", "goes", "gold", "golf", "gone", "good", "gown", "grab",
  "gram", "gray", "grew", "grey", "grid", "grim", "grin", "grip",
  "grow", "gulf", "gust", "hack", "hail", "hair", "hale", "half",
  "hall", "halt", "hand", "hang", "hare", "harp", "harm", "hash",
  "hate", "haul", "have", "hawk", "haze", "hazy", "head", "heal",
  "heap", "hear", "heat", "heel", "held", "helm", "help", "herb",
  "herd", "here", "hero", "hide", "high", "hike", "hill", "hilt",
  "hind", "hint", "hire", "hold", "hole", "holy", "home", "hood",
  "hook", "hope", "horn", "host", "huge", "hull", "hung", "hunt",
  "hurt", "hush", "hymn", "icon", "idea", "idle", "inch", "info",
  "into", "iron", "isle", "item", "jack", "jail", "jazz", "jean",
  "jest", "jilt", "jobs", "join", "joke", "jump", "junk", "jury",
  "just", "keen", "keep", "kept", "kick", "kill", "kind", "king",
  "kiss", "kite", "knee", "knew", "knit", "knob", "knot", "know",
  "lace", "lack", "laid", "lake", "lamb", "lame", "lamp", "land",
  "lane", "lard", "lark", "last", "late", "lawn", "lead", "leaf",
  "leak", "lean", "leap", "left", "lend", "lens", "less", "lick",
  "lien", "life", "lift", "like", "limb", "lime", "limp", "line",
  "link", "lion", "list", "live", "load", "loaf", "loan", "lock",
  "loft", "logo", "lone", "long", "look", "loop", "lord", "lore",
  "lose", "loss", "lost", "loud", "love", "luck", "lump", "lung",
  "lure", "lurk", "lush", "lust", "made", "mail", "main", "make",
  "male", "mall", "malt", "mane", "many", "mare", "mark", "mart",
  "mask", "mass", "mast", "mate", "maze", "mead", "meal", "mean",
  "meat", "meet", "meld", "melt", "memo", "mend", "menu", "mere",
  "mesh", "mild", "mile", "milk", "mill", "mind", "mine", "mint",
  "miss", "mist", "moan", "moat", "mock", "mode", "mold", "mole",
  "monk", "mood", "moon", "moor", "more", "moss", "most", "moth",
  "move", "much", "mule", "muse", "must", "mute", "myth", "nail",
  "name", "navy", "near", "neat", "neck", "need", "nest", "news",
  "next", "nice", "nine", "node", "none", "noon", "norm", "nose",
  "note", "noun", "nude", "null", "oath", "obey", "odds", "odor",
  "once", "only", "onto", "open", "oral", "ours", "oust", "oven",
  "over", "owed", "pace", "pack", "page", "paid", "pail", "pain",
  "pair", "pale", "palm", "pane", "pang", "park", "part", "pass",
  "past", "path", "pave", "peak", "pear", "peat", "peel", "peer",
  "pier", "pile", "pine", "pink", "pipe", "pith", "plan", "play",
  "plea", "plot", "plug", "plum", "poem", "poet", "pole", "poll",
  "pond", "pony", "pool", "poor", "pope", "pore", "pork", "port",
  "pose", "post", "pour", "pray", "prey", "prop", "pros", "pull",
  "pulp", "pump", "pure", "push", "quit", "quiz", "race", "rack",
  "rage", "raid", "rail", "rain", "rake", "ramp", "rang", "rank",
  "rare", "rash", "rate", "rave", "read", "real", "reap", "rear",
  "reed", "reef", "reel", "rely", "rent", "rest", "rice", "rich",
  "ride", "rift", "mild", "rile", "rim", "rind", "ring", "ripe",
  "rise", "risk", "road", "roam", "roar", "robe", "rock", "rode",
  "role", "roll", "roof", "room", "root", "rope", "rose", "rout",
  "rove", "rude", "ruin", "rule", "rump", "rung", "rush", "rust",
  "safe", "sage", "said", "sail", "sake", "sale", "salt", "same",
  "sand", "sane", "sang", "sash", "save", "seal", "seam", "seat",
  "seed", "seek", "seem", "seen", "self", "sell", "send", "sent",
  "shed", "shin", "ship", "shop", "shot", "show", "shut", "sick",
  "side", "sigh", "sign", "silk", "sill", "sing", "sink", "site",
  "size", "skin", "skip", "slab", "slam", "slap", "sled", "slew",
  "slid", "slim", "slip", "slit", "slot", "slow", "slug", "smog",
  "snap", "snow", "soak", "soap", "soar", "sock", "soda", "sofa",
  "soft", "soil", "sold", "sole", "some", "song", "soon", "soot",
  "sore", "sort", "soul", "sour", "span", "spar", "spec", "sped",
  "spin", "spit", "spot", "spun", "spur", "stab", "star", "stay",
  "stem", "step", "stew", "stir", "stop", "stun", "such", "sued",
  "suit", "sulk", "sung", "sunk", "sure", "surf", "swan", "swap",
  "swim", "tabs", "tack", "tact", "tail", "take", "tale", "talk",
  "tall", "tame", "tank", "tape", "tart", "task", "taxi", "team",
  "tear", "tell", "tend", "tent", "term", "test", "text", "than",
  "that", "them", "then", "they", "thin", "this", "thus", "tick",
  "tide", "tidy", "tied", "tier", "tile", "till", "tilt", "time",
  "tiny", "tire", "toad", "toil", "told", "toll", "tomb", "tone",
  "took", "tool", "tops", "tore", "torn", "toss", "tour", "town",
  "trap", "tray", "tree", "trek", "trim", "trio", "trip", "trod",
  "trot", "true", "tube", "tuck", "tuft", "tuna", "tune", "turn",
  "twig", "twin", "type", "tyre", "ugly", "undo", "unit", "unto",
  "upon", "urge", "used", "user", "vain", "vale", "vane", "vary",
  "vast", "veil", "vein", "vent", "verb", "very", "vest", "veto",
  "vice", "view", "vine", "visa", "void", "vole", "volt", "vote",
  "wade", "wage", "waif", "wail", "wait", "wake", "walk", "wall",
  "wand", "want", "ward", "warm", "warn", "warp", "wart", "wary",
  "wash", "wasp", "wave", "wavy", "waxy", "weak", "wear", "weed",
  "week", "weld", "well", "welt", "went", "were", "west", "what",
  "when", "whim", "whip", "whom", "wick", "wide", "wife", "wild",
  "will", "wilt", "wily", "wind", "wine", "wing", "wink", "wipe",
  "wire", "wise", "wish", "with", "woke", "wold", "wolf", "womb",
  "wood", "wool", "word", "wore", "work", "worm", "worn", "wove",
  "wrap", "wren", "yank", "yard", "yarn", "year", "yell", "yoga",
  "yoke", "your", "zeal", "zero", "zinc", "zone", "zoom",
]);

const COMMON_WORDS_5 = new Set([
  "about", "above", "abuse", "acted", "admit", "adopt", "adult", "after",
  "again", "agent", "agree", "ahead", "alarm", "album", "alien", "align",
  "alike", "alive", "alley", "allow", "alone", "along", "alter", "ample",
  "angel", "anger", "angle", "ankle", "apart", "apple", "apply", "arena",
  "arise", "armor", "array", "aside", "asset", "atlas", "avoid", "awake",
  "award", "aware", "awful", "bacon", "badge", "baker", "basic", "basin",
  "basis", "batch", "beach", "beard", "beast", "begin", "being", "below",
  "bench", "berry", "birth", "black", "blade", "blame", "bland", "blank",
  "blast", "blaze", "bleak", "bleed", "blend", "bless", "blind", "blink",
  "bliss", "block", "blood", "bloom", "blown", "board", "boast", "bonus",
  "boost", "bound", "brain", "brand", "brave", "bread", "break", "breed",
  "brick", "bride", "brief", "bring", "broad", "broke", "brook", "brown",
  "brush", "budge", "build", "built", "bunch", "burst", "cabin", "cable",
  "camel", "candy", "carry", "catch", "cause", "cedar", "chain", "chair",
  "chalk", "charm", "chase", "cheap", "check", "cheek", "cheer", "chess",
  "chest", "chief", "child", "chill", "china", "chose", "chunk", "civic",
  "civil", "claim", "clash", "class", "clean", "clear", "clerk", "cliff",
  "climb", "cling", "clock", "clone", "close", "cloth", "cloud", "coach",
  "coast", "color", "comic", "coral", "count", "court", "cover", "crack",
  "craft", "crane", "crash", "crawl", "crazy", "cream", "creek", "crime",
  "cross", "crowd", "crown", "crush", "curve", "cycle", "daily", "dance",
  "death", "debug", "decay", "delay", "demon", "dense", "depot", "depth",
  "derby", "devil", "diary", "dirty", "dizzy", "doing", "donor", "doubt",
  "dough", "draft", "drain", "drake", "drama", "drank", "drape", "drawn",
  "dream", "dress", "dried", "drift", "drill", "drink", "drive", "drone",
  "drown", "drunk", "dryer", "dying", "eager", "eagle", "early", "earth",
  "eight", "elder", "elect", "elite", "empty", "enemy", "enjoy", "enter",
  "equal", "equip", "error", "essay", "event", "every", "exact", "exile",
  "exist", "extra", "fable", "facet", "faint", "fairy", "faith", "false",
  "fancy", "fatal", "fault", "feast", "fence", "fewer", "fiber", "field",
  "fifth", "fifty", "fight", "final", "flame", "flank", "flare", "flash",
  "fleet", "flesh", "fling", "flint", "float", "flock", "flood", "floor",
  "flora", "flour", "fluid", "flush", "focal", "force", "forge", "forth",
  "forum", "found", "frame", "frank", "fraud", "fresh", "front", "frost",
  "froze", "fruit", "fully", "giant", "given", "glass", "gleam", "globe",
  "gloom", "glory", "gloss", "glove", "going", "grace", "grade", "grain",
  "grand", "grant", "grape", "graph", "grasp", "grass", "grave", "great",
  "green", "greet", "grief", "grind", "groan", "groom", "gross", "group",
  "grove", "grown", "guard", "guess", "guide", "guilt", "habit", "happy",
  "harsh", "haven", "heart", "heavy", "hence", "herbs", "hobby", "honor",
  "horse", "hotel", "house", "human", "humor", "hurry", "ideal", "image",
  "imply", "index", "inner", "input", "irony", "issue", "ivory", "jewel",
  "joint", "joker", "judge", "juice", "juicy", "knife", "knock", "known",
  "label", "labor", "lance", "large", "laser", "later", "laugh", "layer",
  "learn", "lease", "least", "leave", "legal", "lemon", "level", "lever",
  "light", "limit", "linen", "liver", "local", "lodge", "logic", "loose",
  "lover", "lower", "lucky", "lunar", "lunch", "lying", "magic", "major",
  "maker", "march", "marry", "marsh", "match", "mayor", "media", "mercy",
  "merge", "merit", "metal", "meter", "might", "minor", "minus", "model",
  "money", "month", "moral", "motif", "motor", "mount", "mouse", "mouth",
  "movie", "music", "nerve", "never", "night", "noble", "noise", "north",
  "noted", "novel", "nurse", "occur", "ocean", "offer", "often", "olive",
  "onset", "opera", "orbit", "order", "organ", "other", "ought", "outer",
  "owner", "oxide", "ozone", "paint", "panel", "panic", "paper", "party",
  "pasta", "patch", "pause", "peace", "peach", "pearl", "penny", "phase",
  "phone", "photo", "piano", "piece", "pilot", "pinch", "pitch", "pixel",
  "pizza", "place", "plain", "plane", "plant", "plate", "plead", "pleat",
  "pluck", "plumb", "plume", "plump", "plunge","point", "polar", "pouch",
  "pound", "power", "press", "price", "pride", "prime", "print", "prior",
  "prize", "probe", "prone", "proof", "proud", "prove", "psalm", "pulse",
  "punch", "pupil", "purse", "queen", "quest", "queue", "quiet", "quote",
  "radar", "radio", "raise", "rally", "ranch", "range", "rapid", "ratio",
  "reach", "react", "realm", "rebel", "reign", "relax", "reply", "rider",
  "ridge", "rifle", "right", "rigid", "rival", "river", "robin", "robot",
  "rocky", "rouge", "rough", "round", "route", "royal", "rugby", "ruler",
  "rumor", "rural", "saint", "salad", "salon", "sauce", "scale", "scare",
  "scene", "scope", "score", "scout", "screw", "sense", "serve", "seven",
  "shade", "shaft", "shake", "shall", "shame", "shape", "share", "shark",
  "sharp", "shave", "sheep", "sheer", "sheet", "shelf", "shell", "shift",
  "shine", "shirt", "shock", "shore", "short", "shout", "sight", "since",
  "sixth", "sixty", "skate", "skill", "skull", "slash", "slate", "slave",
  "sleep", "slice", "slide", "slope", "small", "smart", "smell", "smile",
  "smoke", "snake", "solar", "solve", "sorry", "sound", "south", "space",
  "spare", "spark", "speak", "speed", "spend", "spice", "spite", "split",
  "spoke", "spoon", "sport", "spray", "squad", "staff", "stage", "stain",
  "stair", "stake", "stale", "stall", "stamp", "stand", "stare", "start",
  "state", "stave", "steal", "steam", "steel", "steep", "steer", "stern",
  "stick", "stiff", "still", "sting", "stock", "stole", "stone", "stood",
  "stool", "store", "storm", "story", "stove", "strap", "straw", "strip",
  "stuck", "stuff", "style", "sugar", "suite", "sunny", "super", "surge",
  "swamp", "swear", "sweep", "sweet", "swift", "swing", "sword", "syrup",
  "table", "taste", "teeth", "theft", "theme", "there", "thick", "thing",
  "think", "third", "those", "three", "threw", "throw", "thumb", "tiger",
  "tight", "timer", "title", "toast", "token", "topic", "total", "touch",
  "tough", "tower", "toxic", "trace", "track", "trade", "trail", "train",
  "trait", "trash", "treat", "trend", "trial", "tribe", "trick", "tried",
  "troop", "truck", "truly", "trump", "trunk", "trust", "truth", "tumor",
  "twist", "ultra", "uncle", "under", "union", "unite", "unity", "upper",
  "upset", "urban", "usage", "usual", "utter", "valid", "value", "vapor",
  "vault", "verse", "video", "vigor", "vinyl", "viral", "virus", "visit",
  "vital", "vivid", "vocal", "voice", "voter", "waist", "waste", "watch",
  "water", "weary", "weave", "wheel", "where", "which", "while", "white",
  "whole", "whose", "widow", "width", "witch", "woman", "world", "worry",
  "worse", "worst", "worth", "would", "wound", "wrath", "write", "wrong",
  "wrote", "yacht", "yield", "young", "youth",
]);

// Thematic word pairs we prefer when possible
const THEMATIC_PAIRS: Record<number, [string, string][]> = {
  3: [
    ["hot", "ice"], ["cat", "dog"], ["sun", "fog"], ["big", "wee"],
    ["day", "dim"], ["cup", "mug"], ["hen", "fox"], ["ink", "pen"],
    ["old", "new"], ["war", "win"], ["sad", "joy"], ["boy", "man"],
    ["bug", "ant"], ["bay", "sea"], ["cow", "pig"], ["dam", "bay"],
    ["dew", "fog"], ["eel", "cod"], ["fan", "air"], ["gem", "ore"],
    ["hay", "oat"], ["jab", "hit"], ["key", "pad"], ["lap", "run"],
    ["mad", "sad"], ["nap", "bed"], ["oar", "row"], ["pal", "bud"],
  ],
  4: [
    ["cold", "warm"], ["love", "hate"], ["dawn", "dusk"], ["head", "tail"],
    ["fire", "rain"], ["dark", "glow"], ["king", "duke"], ["milk", "wine"],
    ["fast", "slow"], ["rich", "poor"], ["bold", "meek"], ["hard", "soft"],
    ["fish", "bird"], ["mist", "haze"], ["lake", "pond"], ["cake", "tart"],
    ["bear", "deer"], ["boat", "ship"], ["book", "page"], ["bone", "skin"],
    ["cage", "free"], ["card", "dice"], ["cave", "mine"], ["coal", "gold"],
    ["cork", "wine"], ["dawn", "noon"], ["dust", "sand"], ["fawn", "deer"],
    ["fork", "dish"], ["gate", "door"], ["hare", "mole"], ["hill", "dale"],
    ["home", "fort"], ["iron", "rust"], ["jade", "ruby"], ["kite", "hawk"],
    ["lamp", "glow"], ["mare", "foal"], ["nail", "bolt"], ["palm", "fist"],
    ["rain", "snow"], ["salt", "lime"], ["sand", "dirt"], ["star", "moon"],
    ["tame", "wild"], ["vine", "tree"], ["wand", "mace"], ["wolf", "lamb"],
  ],
  5: [
    ["light", "black"], ["heart", "brain"], ["night", "dream"],
    ["flame", "frost"], ["stone", "water"], ["sword", "lance"],
    ["cloud", "storm"], ["smile", "frown"], ["feast", "table"],
    ["horse", "rider"], ["brave", "timid"], ["giant", "dwarf"],
    ["grape", "peach"], ["house", "cabin"], ["knife", "blade"],
    ["march", "dance"], ["paint", "brush"], ["queen", "crown"],
    ["river", "creek"], ["saint", "angel"], ["tower", "manor"],
    ["urban", "rural"], ["voice", "shout"], ["world", "earth"],
  ],
};

/** BFS to find shortest path between two words */
function bfs(
  start: string,
  target: string,
  graph: Record<string, string[]>
): string[] | null {
  if (start === target) return [start];
  if (!graph[start] || !graph[target]) return null;

  const visited = new Set<string>([start]);
  const queue: [string, string[]][] = [[start, [start]]];

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;
    const neighbours = graph[current] || [];

    for (const neighbour of neighbours) {
      if (neighbour === target) {
        return [...path, target];
      }
      if (!visited.has(neighbour)) {
        visited.add(neighbour);
        queue.push([neighbour, [...path, neighbour]]);
      }
    }
  }

  return null; // No path found
}

/** Check if a word is "common" (in our curated list) */
function isCommon(word: string, len: number): boolean {
  if (len === 3) return COMMON_WORDS_3.has(word);
  if (len === 4) return COMMON_WORDS_4.has(word);
  if (len === 5) return COMMON_WORDS_5.has(word);
  return false;
}

/** Get difficulty label for a word length */
function getDifficulty(len: number): string {
  if (len === 3) return "starter";
  if (len === 4) return "standard";
  if (len === 5) return "advanced";
  return "expert";
}

/** Get the word length for a given day of the week (0=Sun) */
function getWordLengthForDay(dayOfWeek: number): number {
  if (dayOfWeek === 0) return 3; // Sunday: starter
  if (dayOfWeek >= 5) return 5;  // Fri-Sat: advanced
  return 4;                       // Mon-Thu: standard
}

function main() {
  // Load graphs
  const graphs: Record<number, Record<string, string[]>> = {};
  for (const len of [3, 4, 5]) {
    const graphPath = join(DATA_DIR, `graph-${len}.json`);
    graphs[len] = JSON.parse(readFileSync(graphPath, "utf-8"));
    console.log(`Loaded graph-${len}.json (${Object.keys(graphs[len]).length} words)`);
  }

  const puzzles: PuzzleEntry[] = [];
  const usedPairs = new Set<string>(); // Avoid duplicate pairs

  // Start date
  const startDate = new Date("2026-03-20T00:00:00Z");

  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const date = new Date(startDate.getTime() + dayOffset * 86400000);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date.getUTCDay();
    const wordLength = getWordLengthForDay(dayOfWeek);
    const graph = graphs[wordLength];

    if (!graph) {
      console.warn(`No graph for length ${wordLength}, skipping ${dateStr}`);
      continue;
    }

    // Try thematic pairs first
    let foundPuzzle = false;
    const thematicPairs = THEMATIC_PAIRS[wordLength] || [];

    for (const [start, target] of thematicPairs) {
      const pairKey = `${start}-${target}`;
      if (usedPairs.has(pairKey)) continue;

      const path = bfs(start, target, graph);
      if (path && path.length >= 3 && path.length <= 8) {
        // Check that all words on the optimal path are in the graph
        const allValid = path.every((w) => graph[w]);
        if (allValid) {
          usedPairs.add(pairKey);
          puzzles.push({
            id: dayOffset + 1,
            date: dateStr,
            startWord: start,
            targetWord: target,
            wordLength,
            par: path.length - 1,
            optimalPath: path,
            difficulty: getDifficulty(wordLength),
          });
          foundPuzzle = true;
          break;
        }
      }
    }

    // If no thematic pair worked, generate a random one
    if (!foundPuzzle) {
      const allWords = Object.keys(graph);
      const commonWords = allWords.filter((w) => isCommon(w, wordLength));
      const wordPool = commonWords.length > 50 ? commonWords : allWords;

      // Try up to 200 random pairs
      for (let attempt = 0; attempt < 200; attempt++) {
        const startIdx = Math.floor(Math.random() * wordPool.length);
        const startWord = wordPool[startIdx];

        const path = findGoodTarget(startWord, graph, wordPool, wordLength);
        if (path) {
          const pairKey = `${path[0]}-${path[path.length - 1]}`;
          if (!usedPairs.has(pairKey)) {
            usedPairs.add(pairKey);
            puzzles.push({
              id: dayOffset + 1,
              date: dateStr,
              startWord: path[0],
              targetWord: path[path.length - 1],
              wordLength,
              par: path.length - 1,
              optimalPath: path,
              difficulty: getDifficulty(wordLength),
            });
            foundPuzzle = true;
            break;
          }
        }
      }

      if (!foundPuzzle) {
        console.warn(`Could not generate puzzle for ${dateStr}`);
      }
    }
  }

  // Write output
  const outPath = join(DATA_DIR, "daily-puzzles.json");
  writeFileSync(outPath, JSON.stringify(puzzles, null, 2));
  console.log(`\n✓ Generated ${puzzles.length} puzzles → daily-puzzles.json`);
}

/**
 * Find a good target word reachable from startWord in 3-7 steps.
 * Prefer common words with path length 3-6 for a good puzzle experience.
 */
function findGoodTarget(
  startWord: string,
  graph: Record<string, string[]>,
  commonWords: string[],
  wordLength: number
): string[] | null {
  // BFS from start, collect words at distances 3-6
  const visited = new Map<string, string[]>(); // word -> path from start
  visited.set(startWord, [startWord]);
  const queue: [string, string[]][] = [[startWord, [startWord]]];
  const candidates: string[][] = [];

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;
    if (path.length > 7) break; // Don't go beyond 7 steps

    const neighbours = graph[current] || [];
    for (const neighbour of neighbours) {
      if (!visited.has(neighbour)) {
        const newPath = [...path, neighbour];
        visited.set(neighbour, newPath);
        queue.push([neighbour, newPath]);

        // Collect candidates at distance 3-6
        if (newPath.length >= 4 && newPath.length <= 7) {
          if (isCommon(neighbour, wordLength)) {
            candidates.push(newPath);
          }
        }
      }
    }
  }

  if (candidates.length === 0) return null;

  // Pick a random candidate, preferring distance 4-5
  const preferred = candidates.filter(
    (p) => p.length >= 4 && p.length <= 6
  );
  const pool = preferred.length > 0 ? preferred : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}

main();
