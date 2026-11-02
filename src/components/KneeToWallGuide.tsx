import photo from '../assets/knie-zur-wand.jpg';

// Koordinaten im Foto (785 × 497 px): Zehenspitze des vorderen Fußes und Wandfuß direkt davor.
const TOE = { x: 320, y: 442 };
const WALL = { x: 318, y: 430 };

/** Foto mit eingezeichneter Messstrecke und eine Seitenansicht, die zeigt, was gemessen wird. */
export function KneeToWallGuide() {
  return (
    <figure className="guide">
      <div className="guide-photo">
        <img src={photo} alt="Knie-zur-Wand: vorderer Fuß vor der Wand, Knie zur Wand, Hände an der Wand" width={785} height={497} />
        <svg viewBox="0 0 785 497" aria-hidden="true">
          {/* Messstrecke Zehe → Wand */}
          <line x1={WALL.x} y1={WALL.y} x2={TOE.x} y2={TOE.y} stroke="#0A1B2E" strokeWidth="9" strokeLinecap="round" />
          <line x1={WALL.x} y1={WALL.y} x2={TOE.x} y2={TOE.y} stroke="#D4F34A" strokeWidth="5" strokeLinecap="round" />
          <circle cx={WALL.x} cy={WALL.y} r="6" fill="#D4F34A" stroke="#0A1B2E" strokeWidth="2.5" />
          <circle cx={TOE.x} cy={TOE.y} r="6" fill="#D4F34A" stroke="#0A1B2E" strokeWidth="2.5" />
          {/* Beschriftung mit Hinweislinie */}
          <polyline points={`${TOE.x - 8},${TOE.y - 4} 200,392 120,392`} fill="none" stroke="#0A1B2E" strokeWidth="3" />
          <rect x="18" y="352" width="210" height="44" rx="10" fill="#0A1B2E" />
          <text x="123" y="381" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="600" fontSize="22" fill="#D4F34A">Zehe ↔ Wand</text>
        </svg>
      </div>

      <svg className="guide-side" viewBox="0 0 360 222" role="img" aria-label="Seitenansicht: Knie berührt die Wand, Ferse bleibt am Boden, gemessen wird der Abstand von der großen Zehe bis zur Wand">
        {/* Wand und Boden */}
        <rect x="20" y="10" width="14" height="170" fill="#B8C6D1" />
        <text x="40" y="24" fontFamily="Inter, sans-serif" fontSize="12" fill="#51606F">Wand</text>
        <line x1="20" y1="180" x2="345" y2="180" stroke="#51606F" strokeWidth="2" />
        {/* Bein: Hüfte → Knie (an der Wand) → Knöchel über dem Fuß */}
        <polyline points="190,34 42,96 168,162" fill="none" stroke="#0A1B2E" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="42" cy="96" r="9" fill="#00D6A2" stroke="#0A1B2E" strokeWidth="2" />
        {/* Fuß: Zehen zur Wand, Ferse am Boden */}
        <path d="M 100 178 L 180 178 Q 188 178 186 168 L 174 156 Q 142 162 114 170 Q 100 174 100 178 Z" fill="#0A1B2E" />
        {/* Messstrecke Wand → Zehe */}
        <line x1="34" y1="196" x2="100" y2="196" stroke="#0A1B2E" strokeWidth="2.5" />
        <polyline points="42,191 34,196 42,201" fill="none" stroke="#0A1B2E" strokeWidth="2.5" />
        <polyline points="92,191 100,196 92,201" fill="none" stroke="#0A1B2E" strokeWidth="2.5" />
        <line x1="100" y1="180" x2="100" y2="202" stroke="#0A1B2E" strokeWidth="1" strokeDasharray="3 3" />
        <text x="67" y="216" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="600" fill="#0A1B2E">gemessen (cm)</text>
        {/* Beschriftungen */}
        <text x="220" y="92" fontFamily="Inter, sans-serif" fontSize="12" fill="#0A1B2E">Knie berührt</text>
        <text x="220" y="106" fontFamily="Inter, sans-serif" fontSize="12" fill="#0A1B2E">die Wand</text>
        <line x1="216" y1="96" x2="56" y2="96" stroke="#0A1B2E" strokeWidth="1" strokeDasharray="3 3" />
        <text x="196" y="172" fontFamily="Inter, sans-serif" fontSize="12" fill="#0A1B2E">Ferse bleibt am Boden</text>
        <text x="104" y="166" fontFamily="Inter, sans-serif" fontSize="11" fill="#51606F" textAnchor="end">Zehe</text>
      </svg>
      <figcaption className="small">
        Gemessen wird der Abstand von der <strong>Spitze der großen Zehe</strong> bis zur <strong>Wand</strong>, beim weitesten Abstand,
        bei dem das Knie die Wand noch berührt und die Ferse am Boden bleibt.
      </figcaption>
    </figure>
  );
}
