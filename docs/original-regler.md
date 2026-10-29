# Det originale spils regler

Udledt af hovedprogrammet til *Kaptajn Kaper i Kattegat* af P.O. Frederiksen
(Version 1 Release 4, GW-BASIC). Linjenumre henviser til den originale kildekode.

Dette er vores opslagsværk. Vi følger originalens regler, men laver det på en
moderne måde (se "Vores beslutninger" nederst).

## Filerne

| Fil | Indhold |
|---|---|
| hovedprogrammet (.bas) | al logik |
| `titel.pic`, `map.pic`, `sigte.pic` | skærmbilleder, CGA 320×200, 4 farver |
| `figures.dat` | sprites: skibe, sigtekorn, plask, flag |
| `hlp.dat` | hjælpetekster (F1), 9 emner |
| `rec.dat` | rekorden |

## Rammen

**Historien:** Du skal vinde Komtesse Julie Knokkelfryd. Hvert nået mål giver
en forfremmelse; efter fire mål vinder du hende "og det halve kongerige".

**Start (linje 60):** 200 mænd, 20 skyts, 200 Rep, 600 rigsdaler, 30 korn,
0 juveler, 0 point.

**Sværhedsgrad `IDIF`** starter på 2 og stiger med 2 for hvert nået mål
(linje 102). Den indgår i næsten alle formler nedenfor.

| Niveau | IDIF | Titel | Mål | Rang ved målet |
|---|---|---|---|---|
| 1 | 2 | skibsfører | 1000 point på 300 træk | Baron |
| 2 | 4 | kaptajn | +1500 point på 275 træk | Greve |
| 3 | 6 | kommandørkaptajn | +2000 point på 250 træk | Kammerherre |
| 4 | 8 | kommandør | +2500 point på 225 træk | Kronprins: spillet er vundet |

Formler: træk-grænse = nuværende træk + 325 − 12,5 × IDIF;
point-grænse = nuværende point + 500 + 250 × IDIF.

Titlen bruges i tiltale: "Nå skibsfører Ronnie, nu må du vælge:".

**Du taber hvis (linje 960–963, 5000, 6000):**
- Rep ≤ 20 eller mænd ≤ 10.
- Træk-grænsen nås: Julie gifter sig med "den velbårne Tulleman Gylleborg",
  og du hopper i havet af sorg.
- Skibet er for tungt: over 30.000 rigsdaler, 500 mænd, 150 skyts eller 700
  korn ("Vægten af alle dine penge fik skibet til at synke!").

**Point** fås kun ved at kapre/sænke skibe (fjendens rigsdaler ÷ 10) og ved
udbetaling af prisepenge i København.

Ved spillets slut vises point og rekord, og en ny rekord gemmes med navn.

## Kortet (linje 1040–1250)

- Gitter på 30×15 felter. Skibet kan stå på x 1–29, y 1–14. Start: (10, 10).
- Kortbilledet (`map.pic`) er kun til pynt. Kollision afgøres af et separat
  gitter, hvor kun de listede felter er land.
- 8 retninger: piletaster og numpad 1–9 (1/3/7/9 er diagonaler).
- Hvert træk:
  - Træk + 1.
  - Kornforbrug: mænd × IDIF ÷ 800 (0,5 sæk pr. træk med 200 mænd på niveau 1).
  - Hvis kornet er sluppet op: korn = 0, og 10 % af mandskabet dør.
- Ind i land: −3 Rep, skibet bliver stående, trækket er brugt.
- På vand: 25 % chance for en hændelse (se "Til søs").
- Et felt, hvor et skib er kapret eller sænket, giver ikke flere hændelser.
  (Bivirkning i koden: feltet sættes til 50, linje 3000 og 3080. Vi tager den
  ikke med; se "Vores beslutninger".)

### Havne (linje 750–790), (x, y)

| Havn | Felt |
|---|---|
| København | 25, 12 |
| Helsingør | 25, 7 |
| Hundested | 18, 8 |
| Grenå | 9, 1 |
| Ebeltoft | 7, 4 |
| Kalundborg | 11, 13 |
| Mölle | 24, 3 |

Havne overskriver land, hvis et felt er begge dele.

### Landfelter (linje 650–740), (x, y), ordret

```
7,5  8,1  8,2  7,2  7,3  7,4  6,3  5,3  4,5  5,4  5,3  4,2  2,3  5,2  3,3  2,3  2,4  2,5
2,6  2,7  2,8  2,9  1,9  6,11 6,10 26,0 27,0 27,1 27,2 28,1 28,2
28,3 26,4 27,4 28,4 26,5 27,5 27,6 27,7 28,7 28,8 28,9 29,9 29,10 29,11
12,13 13,13 13,12 14,12 15,12 16,12 14,11 15,11 15,10 16,10 17,12
15,9 16,9 16,13 17,13 18,13 19,13 19,13 19,12 19,11 19,10 20,13
20,7 21,6 21,7 21,8 21,9 21,10 21,11 21,12 21,13 21,14 21,15
22,6 22,7 22,8 22,9 22,10 22,11 22,12 22,13 22,14 22,15
23,6 23,7 23,8 23,9 23,10 23,11 23,12 23,13 23,14 23,15 11,14 16,12
24,7 24,8 24,9 24,10 24,11 24,12 24,13 24,14 24,15 11,9 13,8 14,8 13,12 12,12
25,12 25,13 25,14 11,12 10,12 6,9 5,8 6,8 3,12 18,12 19,9 25,3 26,9
```

## Havne-minispillet (linje 1260–1490)

- Før start: "Pas på!!! Der kan komme vindstød fra højre/venstre!" Retningen
  er tilfældig og vises på forhånd.
- Skibe på reden: IDIF × 5 + 1 (11 på niveau 1), tilfældigt placeret.
- En mole tværs over bunden med et hul. Hullet har tilfældig placering og
  bredden 9 − IDIF÷2 tegn (8 tegn = 64 px på 320 px skærm, niveau 1).
- Turen er 18 skridt. Hvert skridt: venstre/højre flytter 10 px. Skibet står
  stille på skærmen, og reden ruller op forbi det.
- Vindstød: chance IDIF ÷ 18 pr. skridt (11 % på niveau 1), skubber 10 px i
  vindens retning.
- Rammer du et skib: −15 × IDIF Rep (30 på niveau 1). Du fortsætter.
- Rammer du molen i sidste skridt: "Dit skib gik ned med mand og mus".
- Tempoet stiger med IDIF.

## Handel i havnen (linje 1500–1720)

Ved hvert havnebesøg sættes nye priser: grundpris × (0,8 + tilfældig 0–1),
altså 80–180 %.

| Valg | Grundpris | Loft |
|---|---|---|
| 1: Hyre mænd | 10 rgsd/mand | i alt 499 |
| 2: Reparere | 8 rgsd/Rep-point | intet |
| 3: Købe kanoner | 100 rgsd/stk | i alt 149 |
| 4: Købe korn | 5 rgsd/sæk | i alt 699 |
| 5: Sælge korn, kanoner eller juveler | samme priser; juveler 50 | det du har |
| 6: Stå til søs igen | | |

"Det har du ikke råd til!" og "Det er for mange!" ved overskridelse.

**København:** her udbetales ventende prisepenge og prisemandskab (se "Kamp").
Point + prisepenge ÷ 10.

## Til søs (linje 1810–1900, 2420–2590)

25 % chance pr. træk på vand. Derefter: 80 % skib, 20 % tågebanke.

### Skibe

"Udkiggen melder: Ship ohøj! Engelsk X i sigte" (type 8: "Sørøverskib i sigte").

| # | Type | Skyts | Mænd | Rgsdl | Korn (maks.) |
|---|---|---|---|---|---|
| 1 | handelsmand | 5 | 80 | 150 | 30 |
| 2 | troppetransport | 10 | 480 | 600 | 15 |
| 3 | kanonbåd | 2 | 40 | 150 | 4 |
| 4 | galease | 15 | 140 | 450 | 5 |
| 5 | brig | 6 | 50 | 200 | 4 |
| 6 | skonnert | 1 | 10 | 30 | 1 |
| 7 | orlogsmand | 50 | 140 | 900 | 20 |
| 8 | Sørøverskib | 70 | 200 | 1500 | 12 |

Fjenden får 100–149 Rep, korn 1..maks., afstand 500–999.

### Tågebanken

"Der er en underlig tågebanke 2 sømil til styrbord... Vil du undersøge det (j/n)?"
Ved ja, 10 % hver:

| Udfald | |
|---|---|
| 20 % | "et væmmeligt skib" dukker op: tilfældigt skib 1–8 |
| 10 % | skattekiste: 600 rigsdaler |
| 10 % | 2–7 juveler |
| 10 % | en kanon |
| 10 % | 9–48 skibbrudne tager hyre |
| 20 % | "Næh! Der var alligevel ikke noget." |
| 10 % | 2–7 sække korn |
| 10 % | pestsyg skibbruden: en tredjedel af mandskabet dør |

## Kamp (linje 1860–3240)

**Moral-faktor:** `(kampe + flugter) / kampe`. Kampe starter på 2, flugter på 1;
kampe + 1 ved hvert møde, flugter + 1 ved hver flugt. Faktoren ganges på den
skade du tager. Kujoner får det sværere.

1. **Angribe (a) eller flygte (f)?** Flugt lykkes altid (men tæller som flugt).
2. **Borde (b) eller skyde (s)?** Uden kanoner er bordning eneste mulighed.

### Kanonkamp (Sigte-skærmen)

- Vind: retning på kompasset (sidevind og længdevind, hver −1/0/+1) og
  styrke 1–10 (0 hvis vindstille).
- Sigtekorn: op/ned = elevation (−30..30), venstre/højre = side (−50..50).
  F = fyr, 0 = afbryd (tilbage til trin 1 med ny afstand).
- **Hvert skud:** fjenden skyder først igen:
  - 60 %: Rep − fjendens skyts ÷ 1,3 × moral-faktor (− lidt tilfældigt).
  - 60 %: mænd − fjendens skyts ÷ 1,4 × moral-faktor (− lidt tilfældigt).
  - (IDIF + fjendens skyts ÷ 5) % chance for at miste en kanon.
- **Sideafvigelse** = vindstyrke × sidevind × 0,1 + lidt tilfældigt − 0,2 × side.
  Forbier hvis afvigelsen er over 2 (1 på IDIF 6, 0 på IDIF 8+).
- **Rækkevidde** = 700 + vindstyrke × længdevind × 10 − 10 × elevation ± 50.
  Træffer hvis rækkevidden ligger mellem afstanden og afstanden + 50.
- **Træffer:**
  - Fjendens Rep − (2 × dine skyts ÷ IDIF + op til 50).
  - Fjendens skyts − tilfældigt 0..10÷IDIF.
  - Fjendens mænd − 0,9 × mænd × (dine skyts + tilfældigt 0..10) ÷ 100.
- Fjenden **synker** ved Rep under 15. Fjenden **overgiver sig** ved 0 skyts,
  Rep under 40 − IDIF, eller færre end 20 mænd.

### Bordning (din skærm 5)

Hver runde:
- Styrkeforhold = fjendens mænd ÷ dine mænd × moral-faktor × IDIF ÷ 10,
  begrænset til 0,6–1,2.
- Du mister: mænd × moral-faktor × IDIF × tilfældigt ÷ 30.
- Fjenden mister: dit tab ÷ styrkeforhold (mindst 10 % af sine mænd).
- "Kampen raser ombord på den engelske X! Fjenden har N faldne, men han har M
  igen. Du har mistet K af dine tapre mænd. Vil du kæmpe videre (k) eller
  vende tilbage til dit skib (t)?" (t = tilbage til trin 1.)
- Fjenden overgiver sig ved færre end 20 mænd.
- Statuspanelet viser Point i stedet for Korn under bordning.

### Sejr

**Overgivelse:** "De overgiver sig!!" Du får fjendens rigsdaler, point
(rigsdaler ÷ 10) og hans korn (mindst 2). Derefter:
- **Sænk den (s):** de overlevende går over til dig.
- **Tag den som prise (p):** du afgiver et prisemandskab på 5 + fjendens
  mænd ÷ 2. Med sandsynlighed (15 − IDIF) ÷ 16 når prisen København; så venter
  dit prisemandskab og fjendens rigsdaler (igen) på dig der.

**Sænket med kanoner:** "Den sank!!" Point (rigsdaler ÷ 10), men ingen penge.
Har du over 500 mænd, smides resten "ud til hajerne".

## Fejl i originalen (kopieres ikke)

- Linje 1505: `irdsd=3000` skulle være `irgsd=30000`; pengeloftet efter
  prisepenge virker ikke.
- Negative antal tjekkes ikke ved køb og salg (gratis penge).
- At sænke et skib, der har overgivet sig, giver pointene to gange.

## Vores beslutninger

- Vi følger originalens regler og tal.
- Moderne udførelse: f.eks. glidende bevægelse i havnen, men med originalens
  vindstød, skade og 18-skridts-længde omsat til tid og afstand.
- Skærmen forbliver 640×480. Originalens koordinater (320×200) omregnes.
- Fejlene ovenfor kopieres ikke.
- Felter med kaprede eller sænkede skibe bliver ikke "rolige". Hændelser er
  tilfældige, så der er ikke noget at forhindre ved at blive på samme felt.
