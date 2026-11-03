// Skizzen und Video-Suchbegriffe zu jeder Übung der Übungsdatenbank.
// Die Figuren zeigen nur die Grundidee (Ausgangs- und Zielstellung). Suchbegriffe führen zu Anleitungen von
// Physiotherapeut:innen; die App bettet keine Suchergebnisse ein und prüft sie nicht.

type Pt = [number, number];
export interface Pose {
  head: Pt;
  neck: Pt;
  hip: Pt;
  /** Schulter- und Hüftpunkte nur in der Vorderansicht */
  sh1?: Pt; sh2?: Pt; hp1?: Pt; hp2?: Pt;
  /** nahe Seite: Arm (Ellbogen, Hand) und Bein (Knie, Fuß, ggf. Zehen) */
  a1: Pt[]; l1: Pt[];
  /** ferne Seite */
  a2: Pt[]; l2: Pt[];
}
export type Prop =
  | { kind: 'floor'; y?: number }
  | { kind: 'mat'; x: number; y?: number; w?: number }
  | { kind: 'chair'; x: number }
  | { kind: 'step'; x: number; w?: number }
  | { kind: 'towel'; x: number; y?: number }
  | { kind: 'wall'; x: number }
  | { kind: 'table'; x: number; w?: number }
  | { kind: 'mirror'; x: number };

export interface Figure {
  from?: Pose;
  to?: Pose;
  arrow?: string;
  props?: Prop[];
  hand?: 'press' | 'curl' | 'lift' | 'wave' | 'fan';
  caption?: string;
}

const move = (p: Pose, dx: number, dy = 0): Pose => {
  const m = (q: Pt): Pt => [q[0] + dx, q[1] + dy];
  return { ...p, head: m(p.head), neck: m(p.neck), hip: m(p.hip), sh1: p.sh1 && m(p.sh1), sh2: p.sh2 && m(p.sh2), hp1: p.hp1 && m(p.hp1), hp2: p.hp2 && m(p.hp2), a1: p.a1.map(m), a2: p.a2.map(m), l1: p.l1.map(m), l2: p.l2.map(m) };
};

/** Rückenlage, Kopf links */
const LIE: Pose = { head: [22, 110], neck: [36, 116], hip: [96, 116], a1: [[62, 120], [86, 121]], a2: [[62, 119], [86, 120]], l1: [[132, 116], [170, 118]], l2: [[132, 117], [170, 119]] };
/** Rückenlage mit aufgestellten Beinen */
const LIE_BENT: Pose = { ...LIE, l1: [[124, 92], [146, 124]], l2: [[126, 93], [148, 124]] };
/** Stehen, Blick nach links, Seitenansicht */
const STAND: Pose = { head: [100, 18], neck: [100, 32], hip: [100, 72], a1: [[102, 52], [104, 72]], a2: [[98, 52], [97, 72]], l1: [[100, 98], [100, 124], [92, 125]], l2: [[101, 98], [101, 124], [93, 125]] };
/** Sitzen auf einem Stuhl (Stuhlrücken bei x), Blick nach rechts */
const sit = (x: number): Pose => ({ head: [x + 4, 36], neck: [x + 2, 50], hip: [x + 6, 88], a1: [[x + 14, 70], [x + 30, 82]], a2: [[x + 12, 70], [x + 28, 84]], l1: [[x + 36, 88], [x + 36, 124], [x + 44, 125]], l2: [[x + 34, 89], [x + 34, 124], [x + 42, 125]] });
/** Vorderansicht, sitzend */
const FRONT_SIT: Pose = {
  head: [104, 24], neck: [104, 40], hip: [104, 84], sh1: [90, 42], sh2: [118, 42], hp1: [96, 84], hp2: [112, 84],
  a1: [[86, 64], [88, 84]], a2: [[122, 64], [120, 84]], l1: [[94, 102], [94, 124]], l2: [[114, 102], [114, 124]],
};
/** Vorderansicht, stehend */
const FRONT_STAND: Pose = {
  head: [110, 18], neck: [110, 32], hip: [110, 72], sh1: [98, 34], sh2: [122, 34], hp1: [103, 72], hp2: [117, 72],
  a1: [[94, 52], [92, 70]], a2: [[126, 52], [128, 70]], l1: [[103, 98], [103, 124]], l2: [[117, 98], [117, 124]],
};
/** Vierfüßlerstand, Kopf links */
const FOURS: Pose = { head: [50, 72], neck: [66, 80], hip: [126, 80], a1: [[66, 102], [66, 124]], a2: [[68, 102], [68, 124]], l1: [[126, 124], [162, 125]], l2: [[128, 124], [164, 125]] };
/** Bauchlage, Kopf links, Arme unter der Stirn */
const PRONE: Pose = { head: [24, 112], neck: [38, 117], hip: [96, 117], a1: [[34, 104], [22, 120]], a2: [[36, 105], [24, 121]], l1: [[132, 118], [170, 119]], l2: [[132, 119], [170, 120]] };

const FLOOR: Prop = { kind: 'floor' };
const sitToStand: Figure = {
  props: [FLOOR, { kind: 'chair', x: 64 }],
  from: { ...sit(64), a1: [[80, 62], [62, 64]], a2: [[80, 63], [62, 65]] },
  to: { head: [98, 16], neck: [98, 30], hip: [96, 70], a1: [[110, 46], [92, 48]], a2: [[110, 47], [92, 49]], l1: [[100, 97], [102, 124], [110, 125]], l2: [[99, 97], [101, 124], [109, 125]] },
  arrow: 'M126 66 Q132 42 116 26',
  caption: 'Arme verschränkt, ohne Hände aufstehen und langsam setzen.',
};
const scapula: Figure = {
  props: [FLOOR],
  to: STAND,
  arrow: 'M112 30 Q122 38 114 52',
  caption: 'Schulterblätter zusammen, dann nach unten ziehen. Schultern nicht hochziehen.',
};

export const FIGURES: Record<string, Figure> = {
  'knie-beugen': { props: [{ kind: 'mat', x: 10, w: 180 }], from: LIE, to: { ...LIE, l1: [[122, 86], [148, 120]] }, arrow: 'M176 108 Q164 94 152 110', caption: 'Ferse Richtung Gesäß gleiten lassen, halten, langsam strecken.' },
  'knie-oberschenkel': { props: [{ kind: 'mat', x: 10, w: 180 }, { kind: 'towel', x: 132, y: 119 }], from: { ...LIE, l1: [[132, 112], [170, 118]] }, to: { ...LIE, l1: [[132, 112], [170, 104]] }, arrow: 'M182 120 L182 102', caption: 'Knie in die Handtuchrolle drücken, Fuß hebt ab.' },
  'knie-aufstehen': sitToStand,
  'knie-minibeuge': {
    props: [FLOOR, { kind: 'chair', x: 40 }],
    from: { ...STAND, a1: [[72, 46], [36, 56]] },
    to: { head: [96, 30], neck: [100, 44], hip: [110, 80], a1: [[72, 56], [36, 58]], a2: [[74, 57], [38, 59]], l1: [[92, 100], [102, 124], [94, 125]], l2: [[93, 101], [103, 124], [95, 125]] },
    arrow: 'M128 34 L128 56', caption: 'Am Stuhl halten, Knie leicht beugen, höchstens etwa 45 Grad.',
  },
  'knie-zehenstand': {
    props: [FLOOR, { kind: 'chair', x: 46 }],
    from: { ...STAND, a1: [[78, 46], [42, 56]] },
    to: { ...move(STAND, 0, -8), a1: [[78, 40], [42, 56]], l1: [[100, 90], [100, 116], [92, 125]], l2: [[101, 90], [101, 116], [93, 125]] },
    arrow: 'M126 56 L126 36', caption: 'Am Stuhl halten, auf die Zehenspitzen und langsam zurück.',
  },
  'knie-stufe': {
    props: [FLOOR, { kind: 'step', x: 60, w: 44 }],
    from: move(STAND, 20),
    to: { ...move(STAND, 16, -10), l1: [[96, 90], [86, 110], [78, 111]] },
    arrow: 'M112 120 Q100 98 88 104', caption: 'Mit einem Bein auf die Stufe steigen, Geländer nutzen.',
  },
  'knie-dehnen': {
    props: [FLOOR, { kind: 'wall', x: 30 }],
    to: { head: [56, 28], neck: [62, 40], hip: [94, 74], a1: [[46, 46], [32, 42]], a2: [[48, 48], [32, 46]], l1: [[74, 98], [70, 124], [62, 125]], l2: [[118, 98], [146, 124], [140, 125]] },
    caption: 'Beispiel Wade: Ausfallschritt mit Halt an der Wand, hintere Ferse bleibt am Boden. 20–30 Sekunden halten.',
  },
  'huefte-gesaess': { props: [{ kind: 'mat', x: 10, w: 180 }], to: LIE, arrow: 'M86 100 Q96 92 106 100', caption: 'Gesäß fest zusammenkneifen, 10 Sekunden halten.' },
  'huefte-bruecke': { props: [{ kind: 'mat', x: 10, w: 180 }], from: LIE_BENT, to: { ...LIE_BENT, neck: [38, 114], hip: [100, 94], l1: [[126, 88], [146, 124]], l2: [[128, 89], [148, 124]] }, arrow: 'M100 122 L100 100', caption: 'Gesäß anspannen, Becken heben, nicht ins Hohlkreuz.' },
  'huefte-seite': {
    props: [FLOOR, { kind: 'chair', x: 50 }],
    from: { ...FRONT_STAND, a1: [[84, 46], [48, 54]] },
    to: { ...FRONT_STAND, a1: [[84, 46], [48, 54]], l2: [[132, 96], [146, 118]] },
    arrow: 'M126 124 Q142 126 154 112', caption: 'Bein seitlich heben, Oberkörper bleibt aufrecht.',
  },
  'huefte-hinten': {
    props: [FLOOR, { kind: 'chair', x: 40 }],
    from: { ...STAND, a1: [[72, 46], [36, 56]] },
    to: { ...STAND, a1: [[72, 46], [36, 56]], l1: [[110, 96], [122, 120], [116, 124]] },
    arrow: 'M106 126 Q120 128 130 114', caption: 'Gestrecktes Bein nach hinten, Gesäß anspannen, nicht nach vorn lehnen.',
  },
  'huefte-knieheben': {
    props: [FLOOR, { kind: 'chair', x: 40 }],
    from: { ...STAND, a2: [[72, 46], [36, 56]] },
    to: { ...STAND, a2: [[72, 46], [36, 56]], l1: [[78, 74], [80, 100], [72, 102]] },
    arrow: 'M94 112 Q80 100 82 84', caption: 'Knie vor dem Körper anheben, langsam senken.',
  },
  'huefte-kniebrust': { props: [{ kind: 'mat', x: 10, w: 180 }], from: LIE, to: { ...LIE, l1: [[82, 84], [104, 104]], a1: [[60, 100], [80, 88]] }, arrow: 'M152 106 Q122 78 94 82', caption: 'Ein Knie zur Brust, das andere Bein bleibt gestreckt.' },
  'huefte-sinken': { props: [{ kind: 'mat', x: 10, w: 180 }], from: LIE_BENT, to: { ...LIE_BENT, l1: [[126, 110], [146, 124]] }, arrow: 'M122 88 Q138 96 130 108', caption: 'Ein Knie langsam zur Seite sinken lassen, Rücken bleibt flach.' },
  'huefte-aufstehen': { ...sitToStand, caption: 'Arme verschränkt aufstehen und setzen; Stuhl bei Bedarf mit Kissen erhöhen.' },
  'schulter-haltung': { props: [FLOOR, { kind: 'mirror', x: 40 }], to: STAND, arrow: 'M112 44 Q120 30 106 24', caption: 'Seitlich vor den Spiegel: Schultern sanft nach oben und hinten gleiten lassen.' },
  'schulter-pendel': {
    props: [FLOOR, { kind: 'chair', x: 34 }],
    to: { head: [56, 46], neck: [70, 52], hip: [112, 72], a1: [[72, 78], [74, 102]], a2: [[52, 64], [30, 56]], l1: [[112, 98], [118, 124], [110, 125]], l2: [[106, 98], [100, 124], [92, 125]] },
    arrow: 'M58 112 Q74 124 92 110', caption: 'Mit einer Hand abstützen, der andere Arm hängt locker und schwingt sanft.',
  },
  'schulter-blaetter': scapula,
  'schulter-heben': { props: [FLOOR], from: STAND, to: { ...STAND, a1: [[86, 22], [78, 8]] }, arrow: 'M96 70 Q70 46 78 16', caption: 'Arme so weit wie angenehm heben, kurz halten.' },
  'schulter-tisch': {
    props: [FLOOR, { kind: 'chair', x: 40 }, { kind: 'table', x: 96, w: 92 }],
    from: { ...sit(40), a1: [[66, 72], [100, 84]], a2: [[64, 73], [98, 85]] },
    to: { ...sit(40), head: [86, 54], neck: [74, 60], a1: [[108, 80], [144, 84]], a2: [[106, 81], [142, 85]] },
    arrow: 'M104 76 L144 76', caption: 'Hände auf einem Tuch nach vorn schieben, Kopf sinken lassen.',
  },
  'schulter-tuer': {
    props: [FLOOR, { kind: 'wall', x: 140 }],
    to: { ...FRONT_STAND, a2: [[126, 56], [136, 58]] },
    arrow: 'M124 72 L138 72', caption: 'Ellbogen im rechten Winkel am Körper, Handrücken drückt gegen den Türrahmen. Druck, keine Bewegung.',
  },
  'nacken-neigen': { props: [FLOOR], from: FRONT_SIT, to: { ...FRONT_SIT, head: [116, 28] }, arrow: 'M98 10 Q114 6 124 18', caption: 'Im Sitzen das Ohr zur Schulter neigen, kurz halten.' },
  'nacken-drehen': { props: [FLOOR, { kind: 'chair', x: 60 }], to: sit(60), arrow: 'M52 30 Q66 14 80 26', caption: 'Im Sitzen den Kopf zur Seite drehen, Kinn bleibt auf gleicher Höhe.' },
  'nacken-kinn': { props: [FLOOR, { kind: 'chair', x: 60 }], from: sit(60), to: { ...sit(60), head: [76, 44] }, arrow: 'M82 26 Q92 36 84 48', caption: 'Kinn langsam zur Brust, aufrecht bleiben.' },
  'nacken-blaetter': scapula,
  'ruecken-rollen': { props: [{ kind: 'mat', x: 10, w: 180 }], from: LIE_BENT, to: { ...LIE_BENT, l1: [[126, 110], [146, 124]], l2: [[128, 112], [148, 124]] }, arrow: 'M122 86 Q140 96 132 110', caption: 'Beide Knie zu einer Seite rollen, Schultern bleiben am Boden.' },
  'ruecken-stabil': { props: [{ kind: 'mat', x: 10, w: 180 }], from: FOURS, to: { ...FOURS, a1: [[42, 78], [20, 76]] }, arrow: 'M66 112 Q40 104 24 86', caption: 'Bauch anspannen, einen Arm nach vorn heben, Becken bleibt waagrecht.' },
  'ruecken-bauchlage': { props: [{ kind: 'mat', x: 10, w: 180 }], from: PRONE, to: { ...PRONE, l1: [[134, 112], [172, 102]] }, arrow: 'M182 118 L182 100', caption: 'Bauch und Gesäß anspannen, ein Bein leicht heben.' },
  'ruecken-dehnen': {
    props: [FLOOR, { kind: 'chair', x: 150 }],
    to: { ...STAND, head: [96, 20], neck: [98, 34], hip: [100, 74], l1: [[124, 80], [158, 88]], l2: [[102, 100], [98, 124], [90, 125]] },
    caption: 'Ein Bein gestreckt auf den Stuhl, das Standbein leicht beugen. Rücken gerade.',
  },
  'ruecken-ausfall': {
    props: [{ kind: 'mat', x: 10, w: 180 }],
    to: { head: [104, 30], neck: [102, 44], hip: [100, 84], a1: [[114, 66], [126, 86]], a2: [[112, 67], [124, 87]], l1: [[128, 90], [130, 124], [138, 125]], l2: [[90, 124], [60, 124]] },
    arrow: 'M94 98 L112 98', caption: 'Hinteres Knie am Boden, Hüfte sanft nach vorn schieben, Oberkörper aufrecht.',
  },
  'hand-kraft': { hand: 'press', caption: 'Hand auf ein Handtuch, Finger zusammenziehen und in den Tisch drücken.' },
  'hand-beugen': { hand: 'curl', caption: 'Finger an den ersten beiden Gelenken beugen, wieder strecken.' },
  'hand-heben': { hand: 'lift', caption: 'Unterarm auf dem Tisch, Hand über der Kante nach oben heben.' },
  'hand-welle': { hand: 'wave', caption: 'Unterarm abstützen, Handgelenk wie beim Winken auf und ab.' },
  'hand-faecher': { hand: 'fan', caption: 'Finger spreizen und schließen; jeden Finger zum Daumen führen.' },
};

/** Suchbegriffe für eine Anleitung von Physiotherapeut:innen (deutsch und englisch). */
export const VIDEO_KEYWORDS: Record<string, { de: string; en: string }> = {
  'knie-beugen': { de: 'Fersenschieben Rückenlage Knie beugen Physiotherapie', en: 'heel slides knee exercise physiotherapist' },
  'knie-oberschenkel': { de: 'Quadrizeps anspannen Handtuchrolle Knie Physiotherapie', en: 'static quads towel roll knee physiotherapist' },
  'knie-aufstehen': { de: 'Aufstehen vom Stuhl ohne Hände Übung Physiotherapie', en: 'sit to stand exercise physiotherapist' },
  'knie-minibeuge': { de: 'Mini Kniebeuge am Stuhl Knie Arthrose Physiotherapie', en: 'mini squat with chair support physiotherapist' },
  'knie-zehenstand': { de: 'Zehenstand Wadenheben mit Stuhl Physiotherapie', en: 'heel raises chair support physiotherapist' },
  'knie-stufe': { de: 'Aufsteigen auf Stufe Knie Übung Physiotherapie', en: 'step ups knee exercise physiotherapist' },
  'knie-dehnen': { de: 'Wadendehnung Oberschenkel Dehnung Knie Physiotherapie', en: 'calf stretch quadriceps hamstring stretch knee physiotherapist' },
  'huefte-gesaess': { de: 'Gesäß anspannen Rückenlage Hüfte Übung Physiotherapie', en: 'glute squeeze lying physiotherapist' },
  'huefte-bruecke': { de: 'Brücke Beckenheben Übung Physiotherapie', en: 'glute bridge exercise physiotherapist' },
  'huefte-seite': { de: 'Bein seitlich heben im Stehen Hüfte Physiotherapie', en: 'standing hip abduction physiotherapist' },
  'huefte-hinten': { de: 'Bein nach hinten strecken im Stehen Hüfte Physiotherapie', en: 'standing hip extension physiotherapist' },
  'huefte-knieheben': { de: 'Knie anheben im Stehen Hüftbeuger Übung Physiotherapie', en: 'standing hip flexion knee raise physiotherapist' },
  'huefte-kniebrust': { de: 'Knie zur Brust Dehnung Rückenlage Physiotherapie', en: 'single knee to chest stretch physiotherapist' },
  'huefte-sinken': { de: 'Knie zur Seite sinken lassen Rückenlage Hüfte Physiotherapie', en: 'bent knee fall out exercise physiotherapist' },
  'huefte-aufstehen': { de: 'Aufstehen vom Stuhl ohne Hände Hüfte Physiotherapie', en: 'sit to stand hip exercise physiotherapist' },
  'schulter-haltung': { de: 'Schulter Haltung korrigieren Schulterblatt Physiotherapie', en: 'shoulder posture correction physiotherapist' },
  'schulter-pendel': { de: 'Pendelübung Schulter Codman Physiotherapie', en: 'pendulum exercise shoulder physiotherapist' },
  'schulter-blaetter': { de: 'Schulterblätter zusammenziehen und senken Übung Physiotherapie', en: 'scapular retraction depression physiotherapist' },
  'schulter-heben': { de: 'Arme heben Schulter Beweglichkeit Übung Physiotherapie', en: 'shoulder flexion stretch physiotherapist' },
  'schulter-tisch': { de: 'Tischrutsche Schulter Übung Physiotherapie', en: 'table slide shoulder exercise physiotherapist' },
  'schulter-tuer': { de: 'isometrische Außenrotation Türrahmen Schulter Physiotherapie', en: 'isometric external rotation door frame physiotherapist' },
  'nacken-neigen': { de: 'Nacken Seitneigung Übung im Sitzen Physiotherapie', en: 'neck side bend exercise physiotherapist' },
  'nacken-drehen': { de: 'Nacken drehen Übung im Sitzen Physiotherapie', en: 'neck rotation exercise physiotherapist' },
  'nacken-kinn': { de: 'Kinn zur Brust Nacken Dehnung Physiotherapie', en: 'chin to chest neck flexion physiotherapist' },
  'nacken-blaetter': { de: 'Schulterblätter zusammenziehen Nacken Übung Physiotherapie', en: 'scapular squeeze neck exercise physiotherapist' },
  'ruecken-rollen': { de: 'Knie rollen Rückenlage Lendenwirbelsäule Physiotherapie', en: 'knee rolls lower back exercise physiotherapist' },
  'ruecken-stabil': { de: 'Vierfüßlerstand Arm heben Rücken stabilisieren Physiotherapie', en: 'bird dog quadruped arm raise physiotherapist' },
  'ruecken-bauchlage': { de: 'Bein heben in Bauchlage Rücken Übung Physiotherapie', en: 'prone leg lift lower back physiotherapist' },
  'ruecken-dehnen': { de: 'Oberschenkelrückseite dehnen Bein auf Stuhl Physiotherapie', en: 'hamstring stretch leg on chair physiotherapist' },
  'ruecken-ausfall': { de: 'Hüftbeuger Dehnung kniender Ausfallschritt Physiotherapie', en: 'kneeling hip flexor stretch physiotherapist' },
  'hand-kraft': { de: 'Handtuch Finger zusammenziehen Hand Arthrose Übung', en: 'towel scrunch hand exercise physiotherapist' },
  'hand-beugen': { de: 'Finger beugen Hakenfaust Hand Arthrose Übung', en: 'hook fist finger flexion exercise hand therapist' },
  'hand-heben': { de: 'Handgelenk heben Unterarm auf Tisch Übung Physiotherapie', en: 'wrist extension exercise forearm on table physiotherapist' },
  'hand-welle': { de: 'Handgelenk beugen strecken Übung Ergotherapie', en: 'wrist flexion extension exercise hand therapist' },
  'hand-faecher': { de: 'Finger spreizen Daumen Fingerkuppen Übung Handtherapie', en: 'finger spread thumb opposition exercise hand therapist' },
};
