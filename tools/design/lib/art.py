"""Generate original KudiCubs placeholder SVG art (spec 002 research D6/D7).
All shapes are drawn from scratch: lion-cub guide Kudi, animal-friend avatars,
UI icons, badges, scenes and stylised (non-replica) regional coins/notes."""
import math, os, sys

OUT = sys.argv[1]
GOLD, GOLD_D, FACE, FACE_D = "#FBAA19", "#E49A18", "#FCE6C6", "#EDD6B8"   # golden_orange, golden_pressed, peach_cream, peach_shade
COCOA, COCOA7, SAND, SAND1 = "#3E2312", "#644D3B", "#FEF5E0", "#FCE6C6"   # mane_brown, brown_80, warm_cream, peach_cream
TERRA, INDIGO, GREEN, TEAL, HIBI = "#F68C1F", "#3E2312", "#3E8E41", "#3E2312", "#FBCE16"   # adventure_orange, mane_brown, illus leaf, mane_brown, sunshine_yellow
YELLOW, SOFT, WHITE, LEAF_L, LEAF_D, STONE, STONE_L, BLUSH = "#FBCE16", "#FBE57E", "#FFFFFF", "#BFE0C8", "#2C6B2F", "#6B7280", "#B9BED6", "#F2A58A"
CREAM_SH = "#F2E8D4"
MUZZLE, NOSE, CHEEK = "#FEF5E0", "#3E2312", "#F2A58A"


def write(rel, body, vb="0 0 200 220", title=""):
    path = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    t = f"<title>{title}</title>" if title else ""
    with open(path, "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img">{t}{body}</svg>\n')


def star(cx, cy, r_out, r_in, n, rot=0):
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = math.pi * i / n + rot
        pts.append(f"{cx + r * math.sin(a):.1f},{cy - r * math.cos(a):.1f}")
    return " ".join(pts)


# ---------------------------------------------------------------- Avatars (animal friends)
def avatar_frame(color, inner, title):
    return (f'<circle cx="100" cy="100" r="96" fill="{color}"/>' + inner), title

AV = {
    "cub-friend-1": avatar_frame("#FCE6C6",  # hare
        f'<ellipse cx="78" cy="48" rx="14" ry="38" fill="#EDD6B8"/><ellipse cx="78" cy="50" rx="6" ry="28" fill="{CHEEK}"/>'
        f'<ellipse cx="122" cy="48" rx="14" ry="38" fill="#EDD6B8"/><ellipse cx="122" cy="50" rx="6" ry="28" fill="{CHEEK}"/>'
        f'<circle cx="100" cy="112" r="50" fill="#FCE6C6"/><circle cx="82" cy="104" r="7" fill="{COCOA}"/><circle cx="118" cy="104" r="7" fill="{COCOA}"/>'
        f'<ellipse cx="100" cy="124" rx="7" ry="5" fill="{NOSE}"/><path d="M90 134 Q100 142 110 134" fill="none" stroke="{COCOA}" stroke-width="4" stroke-linecap="round"/>'
        f'<rect x="94" y="138" width="12" height="10" rx="2" fill="{WHITE}"/>', "Hare friend avatar"),
    "cub-friend-2": avatar_frame("#FFFFFF",  # tortoise
        f'<ellipse cx="100" cy="140" rx="62" ry="38" fill="{GREEN}"/><path d="M70 130 l15 -14 l15 14 l15 -14 l15 14" fill="none" stroke="#BFE0C8" stroke-width="5"/>'
        f'<circle cx="100" cy="86" r="40" fill="#BFE0C8"/><circle cx="86" cy="80" r="7" fill="{COCOA}"/><circle cx="114" cy="80" r="7" fill="{COCOA}"/>'
        f'<circle cx="88" cy="77" r="2.5" fill="{WHITE}"/><circle cx="116" cy="77" r="2.5" fill="{WHITE}"/>'
        f'<path d="M86 100 Q100 112 114 100" fill="none" stroke="{COCOA}" stroke-width="4" stroke-linecap="round"/>', "Tortoise friend avatar"),
    "cub-friend-3": avatar_frame("#FBE57E",  # guinea fowl
        f'<circle cx="100" cy="116" r="54" fill="#6B7280"/>' + "".join(f'<circle cx="{x}" cy="{y}" r="4" fill="{WHITE}"/>' for x, y in [(70,120),(84,140),(100,150),(116,140),(130,120),(78,100),(122,100),(100,128)])
        + f'<circle cx="100" cy="74" r="30" fill="#B9BED6"/><path d="M92 46 Q100 30 108 46 Z" fill="{TERRA}"/>'
        f'<circle cx="90" cy="72" r="6" fill="{COCOA}"/><circle cx="110" cy="72" r="6" fill="{COCOA}"/><path d="M94 84 L106 84 L100 96 Z" fill="{GOLD}"/>'
        f'<ellipse cx="100" cy="100" rx="8" ry="6" fill="{HIBI}"/>', "Guinea fowl friend avatar"),
    "cub-friend-4": avatar_frame("#F2E8D4",  # young elephant
        f'<ellipse cx="50" cy="100" rx="30" ry="40" fill="#B9BED6"/><ellipse cx="150" cy="100" rx="30" ry="40" fill="#B9BED6"/>'
        f'<circle cx="100" cy="96" r="50" fill="#B9BED6"/><path d="M100 110 Q96 150 112 168" fill="none" stroke="#B9BED6" stroke-width="20" stroke-linecap="round"/>'
        f'<circle cx="82" cy="88" r="7" fill="{COCOA}"/><circle cx="118" cy="88" r="7" fill="{COCOA}"/><circle cx="84" cy="85" r="2.5" fill="{WHITE}"/><circle cx="120" cy="85" r="2.5" fill="{WHITE}"/>'
        f'<circle cx="74" cy="108" r="7" fill="{CHEEK}" opacity="0.5"/><circle cx="126" cy="108" r="7" fill="{CHEEK}" opacity="0.5"/>', "Young elephant friend avatar"),
}
for name, (body, title) in AV.items():
    write(f"avatars/{name}.svg", body, vb="0 0 200 200", title=title)

# ---------------------------------------------------------------- Icons (24x24, single stroke style)
S = f'fill="none" stroke="{COCOA}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"'
ICONS = {
    "home": f'<path d="M3 11 L12 3 L21 11" {S}/><path d="M5 10 V21 H19 V10" {S}/><path d="M10 21 V15 H14 V21" {S}/>',
    "wallet-jar": f'<path d="M7 4 H17 V7 Q20 9 20 13 V19 Q20 21 18 21 H6 Q4 21 4 19 V13 Q4 9 7 7 Z" {S}/><circle cx="12" cy="15" r="3" fill="{GOLD}" stroke="{GOLD_D}" stroke-width="1.5"/>',
    "path": f'<path d="M5 20 Q5 14 12 14 Q19 14 19 8 Q19 4 14 4" {S}/><circle cx="5" cy="20" r="2" fill="{GOLD}"/><circle cx="12" cy="14" r="2" fill="{GOLD}"/><circle cx="14" cy="4" r="2" fill="{GOLD}"/>',
    "speaker": f'<path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="{COCOA}" stroke="{COCOA}" stroke-width="1.5" stroke-linejoin="round"/><path d="M16 9 Q18 12 16 15 M18.5 7 Q22 12 18.5 17" fill="none" stroke="{COCOA}" stroke-width="2" stroke-linecap="round"/>',
    "replay": f'<path d="M5 12 A7 7 0 1 0 8 6.3" fill="none" stroke="{COCOA}" stroke-width="2.4" stroke-linecap="round"/><path d="M8.5 2.5 L8 6.6 L4 6" fill="none" stroke="{COCOA}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 9.5 L15 12 L10.5 14.5 Z" fill="{COCOA}"/>',
    "thumbs-answer": f'<path d="M7 11 L10 4 Q12 3 12.5 6 L12 10 H18 Q20 10 19.5 12.5 L18 18 Q17.5 20 15.5 20 H7 Z" fill="{YELLOW}" stroke="{COCOA}" stroke-width="1.8" stroke-linejoin="round"/><rect x="3" y="11" width="4" height="9" rx="1" fill="{YELLOW}" stroke="{COCOA}" stroke-width="1.8"/>',
    "back": f'<path d="M15 5 L8 12 L15 19" {S}/>',
    "lock": f'<rect x="5" y="11" width="14" height="10" rx="2" {S}/><path d="M8 11 V8 Q8 4 12 4 Q16 4 16 8 V11" {S}/>',
    "sun-daily": f'<circle cx="12" cy="12" r="5" fill="{GOLD}" stroke="{GOLD_D}" stroke-width="1.5"/>' + "".join(
        f'<path d="M{12+8*math.cos(a):.1f} {12+8*math.sin(a):.1f} L{12+10.5*math.cos(a):.1f} {12+10.5*math.sin(a):.1f}" stroke="{GOLD_D}" stroke-width="2" stroke-linecap="round"/>' for a in [i*math.pi/4 for i in range(8)]),
    "piggy": f'<ellipse cx="12" cy="13" rx="8" ry="6" fill="{CHEEK}" stroke="{COCOA}" stroke-width="1.6"/><circle cx="19" cy="13" r="2" fill="#F2A58A" stroke="{COCOA}" stroke-width="1.2"/><circle cx="14" cy="11" r="1" fill="{COCOA}"/><path d="M9 7 H13" stroke="{COCOA}" stroke-width="1.8" stroke-linecap="round"/><path d="M8 18 V20 M15 18 V20" stroke="{COCOA}" stroke-width="1.8" stroke-linecap="round"/>',
    "treat-sticker": f'<circle cx="12" cy="12" r="9" fill="{HIBI}"/><path d="M12 6 L13.8 10 L18 10.3 L14.8 13 L15.8 17.2 L12 15 L8.2 17.2 L9.2 13 L6 10.3 L10.2 10 Z" fill="{GOLD}"/>',
    "check": f'<path d="M5 12 L10 17 L19 7" {S}/>',
    "close": f'<path d="M6 6 L18 18 M18 6 L6 18" {S}/>',
    "goal-coins": f'<circle cx="9" cy="14" r="5" fill="{GOLD}" stroke="{GOLD_D}" stroke-width="1.5"/><circle cx="15" cy="10" r="5" fill="{GOLD}" stroke="{GOLD_D}" stroke-width="1.5"/>',
    "save": f'<path d="M7 4 H17 V7 Q20 9 20 13 V19 Q20 21 18 21 H6 Q4 21 4 19 V13 Q4 9 7 7 Z" fill="{SAND1}" stroke="{GREEN}" stroke-width="2"/><path d="M12 9 V17 M8.5 13.5 L12 17 L15.5 13.5" fill="none" stroke="{GREEN}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
}
for name, body in ICONS.items():
    write(f"icons/{name}.svg", body, vb="0 0 24 24", title=name.replace("-", " "))

BADGES = {
    "badge-hard-worker": (GOLD, f'<path d="M30 44 L44 30 M36 24 L50 38" stroke="{COCOA}" stroke-width="5" stroke-linecap="round"/><rect x="40" y="18" width="16" height="10" rx="2" transform="rotate(45 48 23)" fill="{COCOA7}"/>', "Hard Worker badge"),
    "badge-smart-sorter": (TEAL, "".join(f'<rect x="{x}" y="{46-h}" width="8" height="{h}" rx="2" fill="{GOLD}"/>' for x, h in [(22,10),(32,18),(42,26)]), "Smart Sorter badge"),
    "badge-smart-saver": (GREEN, f'<ellipse cx="36" cy="38" rx="14" ry="10" fill="{CHEEK}"/><rect x="31" y="22" width="10" height="4" rx="2" fill="{GOLD}"/>', "Smart Saver badge"),
    "badge-first-coins": (TERRA, f'<circle cx="31" cy="38" r="9" fill="{GOLD}" stroke="{GOLD_D}" stroke-width="2"/><circle cx="41" cy="30" r="9" fill="{GOLD}" stroke="{GOLD_D}" stroke-width="2"/>', "First Coins badge"),
    "badge-kind-friend": (HIBI, f'<path d="M36 48 C20 38 20 24 30 24 C34 24 36 28 36 28 C36 28 38 24 42 24 C52 24 52 38 36 48 Z" fill="{WHITE}"/>', "Kind Friend badge"),
    "badge-early-bird": (INDIGO, f'<circle cx="36" cy="34" r="9" fill="{GOLD}"/><path d="M20 46 H52" stroke="{GOLD}" stroke-width="4" stroke-linecap="round"/>', "Early Bird badge"),
    "badge-market-explorer": (GOLD_D, f'<path d="M22 30 H50 L46 22 H26 Z" fill="{TERRA}"/><rect x="25" y="30" width="22" height="16" fill="{SAND1}"/>', "Market Explorer badge"),
    "badge-pride-star": (COCOA7, f'<polygon points="{star(36, 36, 14, 6, 5)}" fill="{GOLD}"/>', "Pride Star badge"),
}
for name, (color, inner, title) in BADGES.items():
    write(f"icons/{name}.svg", f'<polygon points="{star(36, 36, 34, 30, 12)}" fill="{color}"/><circle cx="36" cy="36" r="24" fill="{color}" stroke="{WHITE}" stroke-width="3"/>{inner}',
          vb="0 0 72 72", title=title)

# ---------------------------------------------------------------- Scenes
def awning(x, y, w, colors):
    n = 6; sw = w / n
    stripes = "".join(f'<path d="M{x+i*sw:.1f} {y} h{sw:.1f} v26 q-{sw/2:.1f} 12 -{sw:.1f} 0 Z" fill="{colors[i%2]}"/>' for i in range(n))
    return stripes

woven = "".join(f'<rect x="{i*20}" y="0" width="10" height="10" fill="{c}"/><rect x="{i*20+10}" y="10" width="10" height="10" fill="{c}"/>'
                for i, c in zip(range(20), [GOLD, TERRA, INDIGO, GREEN] * 5))
market = (f'<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE57E"/><stop offset="1" stop-color="{SAND}"/></linearGradient></defs>'
          f'<rect width="400" height="600" fill="url(#sky)"/><circle cx="330" cy="80" r="40" fill="{GOLD}" opacity="0.8"/>'
          # baobab tree
          f'<path d="M48 330 Q52 240 60 200 Q40 190 30 170 M60 200 Q70 180 96 172 M64 205 Q80 196 92 200" stroke="{COCOA7}" stroke-width="14" fill="none" stroke-linecap="round"/>'
          f'<path d="M40 340 Q54 250 62 200 Q72 250 84 340 Z" fill="{COCOA7}"/><ellipse cx="62" cy="160" rx="54" ry="28" fill="{GREEN}" opacity="0.85"/>'
          # stalls
          f'<rect x="140" y="230" width="110" height="90" fill="{SAND1}" stroke="{GOLD_D}" stroke-width="3"/>' + awning(132, 206, 126, [TERRA, GOLD]) +
          f'<rect x="270" y="250" width="100" height="80" fill="{SAND1}" stroke="{GOLD_D}" stroke-width="3"/>' + awning(262, 226, 116, [INDIGO, SAND]) +
          f'<circle cx="170" cy="300" r="10" fill="{TERRA}"/><circle cx="192" cy="302" r="10" fill="{GOLD}"/><circle cx="214" cy="300" r="10" fill="{GREEN}"/>'
          f'<rect x="290" y="300" width="20" height="16" fill="{HIBI}"/><rect x="318" y="296" width="20" height="20" fill="{GOLD}"/>'
          # ground, path, bushes
          f'<rect y="330" width="400" height="270" fill="#EDD6B8"/><path d="M160 600 Q190 460 230 330 L260 330 Q240 460 280 600 Z" fill="#FCE6C6"/>'
          f'<ellipse cx="60" cy="420" rx="60" ry="30" fill="{GREEN}" opacity="0.7"/><ellipse cx="350" cy="440" rx="70" ry="34" fill="{GREEN}" opacity="0.7"/>'
          f'<ellipse cx="120" cy="530" rx="50" ry="22" fill="{GREEN}" opacity="0.6"/><ellipse cx="330" cy="560" rx="60" ry="24" fill="{GREEN}" opacity="0.6"/>'
          f'<rect x="20" y="380" width="70" height="40" rx="6" fill="{TERRA}"/><rect x="300" y="380" width="80" height="34" rx="6" fill="{INDIGO}"/>'
          f'<g transform="translate(0 586)">{woven}</g>')
write("scenes/market-park.svg", market, vb="0 0 400 600", title="Market-day park with stalls")

stall = (f'<rect width="400" height="300" fill="{SAND}"/><rect y="220" width="400" height="80" fill="#EDD6B8"/>'
         f'<rect x="80" y="110" width="240" height="110" fill="{SAND1}" stroke="{GOLD_D}" stroke-width="4"/>' + awning(66, 76, 268, [TERRA, GOLD]) +
         f'<rect x="100" y="170" width="200" height="12" fill="{COCOA7}"/>'
         + "".join(f'<circle cx="{x}" cy="160" r="12" fill="{c}"/>' for x, c in [(130, TERRA), (160, GOLD), (190, GREEN), (220, HIBI), (250, GOLD), (280, TERRA)])
         + f'<g transform="translate(0 286)">{woven}</g>')
write("scenes/stall.svg", stall, vb="0 0 400 300", title="Market stall")

jar = (f'<path d="M30 20 H90 V32 Q104 40 104 60 V128 Q104 140 92 140 H28 Q16 140 16 128 V60 Q16 40 30 32 Z" fill="#FFFFFF" fill-opacity="0.55" stroke="{TEAL}" stroke-width="5"/>'
       f'<rect x="26" y="8" width="68" height="16" rx="6" fill="{TERRA}"/><path d="M30 50 Q36 44 44 46" stroke="{WHITE}" stroke-width="5" fill="none" stroke-linecap="round"/>')
write("scenes/jars.svg", jar, vb="0 0 120 150", title="Clear coin jar")

# ---------------------------------------------------------------- Coins and notes (stylised tokens, NOT replicas)
METAL = {"silver": ("#D8D2C8", "#A79E90"), "bronze": ("#D79A5E", "#A86B34"), "gold": (GOLD, GOLD_D), "bi": (GOLD, "#A79E90")}
ACCENT = {"gh": ["#C8102E", GOLD, "#006B3F"], "ng": ["#008751", "#FFFFFF", "#008751"], "uk": ["#012169", "#FFFFFF", "#C8102E"]}

def coin(region, big, small, metal, r):
    face, rim = METAL[metal]
    inner = GOLD if metal == "bi" else face
    ring = "".join(f'<path d="M{50-r*0.82:.1f} 50 A{r*0.82:.1f} {r*0.82:.1f} 0 0 1 {50+r*0.82:.1f} 50" transform="rotate({i*60-90} 50 50)" fill="none" stroke="{c}" stroke-width="3" stroke-dasharray="6 4"/>'
                   for i, c in enumerate(ACCENT[region]))
    fs = 30 if len(big) <= 2 else 24
    return (f'<circle cx="50" cy="50" r="{r}" fill="{rim}" stroke="{COCOA}" stroke-width="3"/><circle cx="50" cy="50" r="{r-5}" fill="{face}"/>'
            f'<circle cx="50" cy="50" r="{r*0.62:.1f}" fill="{inner}"/>{ring}'
            f'<text x="50" y="{54 if small else 60}" text-anchor="middle" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="700" font-size="{fs}" fill="{COCOA}">{big}</text>'
            + (f'<text x="50" y="72" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="11" fill="{COCOA}">{small}</text>' if small else ""))

def note(region, big, small):
    a = ACCENT[region]
    return (f'<rect x="4" y="22" width="92" height="56" rx="8" fill="{LEAF_L}" stroke="{COCOA}" stroke-width="3"/>'
            f'<rect x="4" y="22" width="14" height="56" rx="4" fill="{a[0]}"/><rect x="82" y="22" width="14" height="56" rx="4" fill="{a[2]}"/>'
            f'<circle cx="50" cy="50" r="18" fill="{WHITE}" opacity="0.6"/>'
            f'<text x="50" y="56" text-anchor="middle" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="700" font-size="22" fill="{COCOA}">{big}</text>'
            f'<text x="50" y="72" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="9" fill="{COCOA}">{small}</text>')

COINS = {
    "gh": [("p10", "10", "PESEWAS", "silver", 36), ("p20", "20", "PESEWAS", "silver", 40), ("p50", "50", "PESEWAS", "bronze", 42),
           ("ghs1", "1", "CEDI", "bi", 46), ("ghs2", "2", "CEDIS", "gold", 48)],
    "ng": [("k50", "50", "KOBO", "bronze", 40), ("ngn1", "1", "NAIRA", "bi", 44), ("ngn2", "2", "NAIRA", "silver", 48)],
    "uk": [("p10", "10", "PENCE", "silver", 36), ("p20", "20", "PENCE", "silver", 40), ("p50", "50", "PENCE", "silver", 44),
           ("gbp1", "1", "POUND", "bi", 42), ("gbp2", "2", "POUNDS", "gold", 48)],
}
NOTES = {"gh": [("ghs5-note", "5", "CEDIS")], "ng": [("ngn5-note", "5", "NAIRA"), ("ngn10-note", "10", "NAIRA")], "uk": [("gbp5-note", "5", "POUNDS")]}
for region, items in COINS.items():
    for cid, big, small, metal, r in items:
        write(f"coins/{region}/{cid}.svg", coin(region, big, small, metal, r), vb="0 0 100 100", title=f"{big} {small.lower()} coin (stylised)")
    for nid, big, small in NOTES[region]:
        write(f"coins/{region}/{nid}.svg", note(region, big, small), vb="0 0 100 100", title=f"{big} {small.lower()} note (stylised)")

print("art written to", OUT)
