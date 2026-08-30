import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect, G } from 'react-native-svg';

export interface MascotProps {
  size?: number;
  animate?: boolean;
  expression?: 'happy' | 'excited' | 'thinking';
}

export function Mascot({ size = 120, animate = true, expression = 'happy' }: MascotProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rockAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;

    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    const rock = Animated.loop(
      Animated.sequence([
        Animated.timing(rockAnim, {
          toValue: -2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(rockAnim, {
          toValue: 2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(rockAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    bounce.start();
    rock.start();

    return () => {
      bounce.stop();
      rock.stop();
    };
  }, [animate]);

  const s = size / 120;

  // All coordinates are in a 120x160 viewBox
  const vw = 120;
  const vh = 160;

  // ── Geometry constants (base 120px wide) ──
  // Pot: trapezoid bottom
  const potTop = 118;
  const potBottom = 148;
  const potTopW = 44;
  const potBottomW = 52;
  const potCx = 60;
  const potTopL = potCx - potTopW / 2;
  const potTopR = potCx + potTopW / 2;
  const potBotL = potCx - potBottomW / 2;
  const potBotR = potCx + potBottomW / 2;
  const potPath = `M${potTopL},${potTop} L${potTopR},${potTop} L${potBotR},${potBottom} Q${potCx},${potBottom + 6} ${potBotL},${potBottom} Z`;
  const potRimPath = `M${potTopL - 4},${potTop} Q${potCx},${potTop - 5} ${potTopR + 4},${potTop}`;

  // Stem
  const stemX = 56;
  const stemW = 8;
  const stemTop = 78;
  const stemBottom = potTop;

  // Leaves
  // Left leaf: ellipse rotated -30deg, centered left of stem
  // Right leaf: ellipse rotated +30deg, centered right of stem

  // Head: circle at top
  const headCx = 60;
  const headCy = 52;
  const headR = 28;

  // Arms: rounded rects sticking out from stem sides, slightly raised
  const armW = 14;
  const armH = 8;
  const armY = 92;
  const leftArmX = stemX - armW - 2;
  const rightArmX = stemX + stemW + 2;

  // Eyes
  const eyeY = headCy - 4;
  const leftEyeCx = headCx - 10;
  const rightEyeCx = headCx + 10;
  const eyeR = 6;
  const pupilR = 3.2;
  const shineR = 1.2;

  // Cheeks
  const cheekY = headCy + 8;
  const leftCheekCx = headCx - 14;
  const rightCheekCx = headCx + 14;

  // Smile arc: happy
  const smileHappy = `M${headCx - 10},${headCy + 10} Q${headCx},${headCy + 18} ${headCx + 10},${headCy + 10}`;
  // Smile arc: excited (bigger)
  const smileExcited = `M${headCx - 13},${headCy + 8} Q${headCx},${headCy + 22} ${headCx + 13},${headCy + 8}`;
  // Smile arc: thinking (slight)
  const smileThinking = `M${headCx - 8},${headCy + 12} Q${headCx + 2},${headCy + 16} ${headCx + 8},${headCy + 12}`;

  const smilePath =
    expression === 'excited'
      ? smileExcited
      : expression === 'thinking'
      ? smileThinking
      : smileHappy;

  // Eyebrow paths
  const leftBrowHappy = `M${leftEyeCx - 5},${eyeY - 8} Q${leftEyeCx},${eyeY - 11} ${leftEyeCx + 5},${eyeY - 8}`;
  const rightBrowHappy = `M${rightEyeCx - 5},${eyeY - 8} Q${rightEyeCx},${eyeY - 11} ${rightEyeCx + 5},${eyeY - 8}`;
  // Thinking: right brow raised
  const rightBrowThinking = `M${rightEyeCx - 5},${eyeY - 10} Q${rightEyeCx},${eyeY - 15} ${rightEyeCx + 5},${eyeY - 10}`;

  // Thinking bubble "..."
  const thinkBubbleX = headCx + headR - 4;
  const thinkBubbleY = headCy - headR + 2;

  // Star eye path (for excited)
  const starPath = (cx: number, cy: number, r: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.45;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return pts.join(' ') + ' Z';
  };

  const rotateInterpolate = rockAnim.interpolate({
    inputRange: [-2, 2],
    outputRange: ['-2deg', '2deg'],
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size * (vh / vw),
        transform: [
          { translateY: bounceAnim },
          { rotate: rotateInterpolate },
        ],
      }}
    >
      <Svg
        width={size}
        height={size * (vh / vw)}
        viewBox={`0 0 ${vw} ${vh}`}
      >
        {/* ── Pot ── */}
        {/* Pot body */}
        <Path d={potPath} fill="#8B5E3C" />
        {/* Pot highlight stripe */}
        <Path
          d={`M${potTopL + 4},${potTop + 4} L${potTopR - 4},${potTop + 4} L${potBotR - 6},${potTop + 14} L${potBotL + 6},${potTop + 14} Z`}
          fill="#A0522D"
          opacity={0.5}
        />
        {/* Pot rim */}
        <Rect
          x={potTopL - 4}
          y={potTop - 5}
          width={potTopW + 8}
          height={8}
          rx={4}
          fill="#A0522D"
        />

        {/* ── Soil in pot ── */}
        <Ellipse
          cx={potCx}
          cy={potTop - 1}
          rx={potTopW / 2 + 2}
          ry={5}
          fill="#6B4226"
        />

        {/* ── Stem ── */}
        <Rect
          x={stemX}
          y={stemTop}
          width={stemW}
          height={stemBottom - stemTop}
          rx={4}
          fill="#4CAF50"
        />

        {/* ── Left Leaf ── */}
        <G
          origin={`${stemX + 2},${stemTop + 20}`}
          rotation={-30}
        >
          <Ellipse
            cx={stemX - 14}
            cy={stemTop + 20}
            rx={18}
            ry={10}
            fill="#66BB6A"
          />
          {/* Leaf vein */}
          <Path
            d={`M${stemX + 2},${stemTop + 20} L${stemX - 26},${stemTop + 20}`}
            stroke="#4CAF50"
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        </G>

        {/* ── Right Leaf ── */}
        <G
          origin={`${stemX + stemW - 2},${stemTop + 30}`}
          rotation={30}
        >
          <Ellipse
            cx={stemX + stemW + 14}
            cy={stemTop + 30}
            rx={18}
            ry={10}
            fill="#66BB6A"
          />
          {/* Leaf vein */}
          <Path
            d={`M${stemX + stemW - 2},${stemTop + 30} L${stemX + stemW + 26},${stemTop + 30}`}
            stroke="#4CAF50"
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        </G>

        {/* ── Arms ── */}
        {/* Left arm */}
        <Rect
          x={leftArmX}
          y={armY - 3}
          width={armW}
          height={armH}
          rx={4}
          fill="#81C784"
          transform={`rotate(-20, ${leftArmX + armW / 2}, ${armY + armH / 2})`}
        />
        {/* Right arm */}
        <Rect
          x={rightArmX}
          y={armY - 3}
          width={armW}
          height={armH}
          rx={4}
          fill="#81C784"
          transform={`rotate(20, ${rightArmX + armW / 2}, ${armY + armH / 2})`}
        />

        {/* ── Head ── */}
        {/* Head shadow */}
        <Circle cx={headCx + 2} cy={headCy + 3} r={headR} fill="rgba(0,0,0,0.08)" />
        {/* Head */}
        <Circle cx={headCx} cy={headCy} r={headR} fill="#81C784" />
        {/* Head highlight */}
        <Circle cx={headCx - 8} cy={headCy - 10} r={10} fill="rgba(255,255,255,0.18)" />

        {/* ── Eyebrows ── */}
        {expression !== 'excited' && (
          <>
            <Path
              d={leftBrowHappy}
              stroke="#1A1A2E"
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d={expression === 'thinking' ? rightBrowThinking : rightBrowHappy}
              stroke="#1A1A2E"
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}

        {/* ── Eyes ── */}
        {expression === 'excited' ? (
          <>
            {/* Star eyes */}
            <Path d={starPath(leftEyeCx, eyeY, eyeR + 1)} fill="#FFD700" />
            <Path d={starPath(rightEyeCx, eyeY, eyeR + 1)} fill="#FFD700" />
            {/* Star shine */}
            <Circle cx={leftEyeCx - 2} cy={eyeY - 2} r={shineR} fill="#fff" />
            <Circle cx={rightEyeCx - 2} cy={eyeY - 2} r={shineR} fill="#fff" />
          </>
        ) : (
          <>
            {/* White of eye */}
            <Circle cx={leftEyeCx} cy={eyeY} r={eyeR} fill="#FFFFFF" />
            <Circle cx={rightEyeCx} cy={eyeY} r={eyeR} fill="#FFFFFF" />
            {/* Pupils */}
            <Circle cx={leftEyeCx + 1} cy={eyeY + 1} r={pupilR} fill="#1A1A2E" />
            <Circle cx={rightEyeCx + 1} cy={eyeY + 1} r={pupilR} fill="#1A1A2E" />
            {/* Shine dots */}
            <Circle cx={leftEyeCx - 1} cy={eyeY - 1} r={shineR} fill="#FFFFFF" />
            <Circle cx={rightEyeCx - 1} cy={eyeY - 1} r={shineR} fill="#FFFFFF" />
          </>
        )}

        {/* ── Rosy Cheeks ── */}
        <Circle cx={leftCheekCx} cy={cheekY} r={6} fill="#FF8A80" opacity={0.4} />
        <Circle cx={rightCheekCx} cy={cheekY} r={6} fill="#FF8A80" opacity={0.4} />

        {/* ── Smile ── */}
        <Path
          d={smilePath}
          stroke="#1A1A2E"
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
        />

        {/* ── Thinking bubble ── */}
        {expression === 'thinking' && (
          <G>
            <Circle cx={thinkBubbleX + 2} cy={thinkBubbleY - 4} r={2} fill="#FFFFFF" opacity={0.9} />
            <Circle cx={thinkBubbleX + 6} cy={thinkBubbleY - 8} r={3} fill="#FFFFFF" opacity={0.9} />
            <Circle cx={thinkBubbleX + 12} cy={thinkBubbleY - 14} r={5} fill="#FFFFFF" opacity={0.9} />
            {/* Dots inside bubble */}
            <Circle cx={thinkBubbleX + 9} cy={thinkBubbleY - 14} r={1} fill="#81C784" />
            <Circle cx={thinkBubbleX + 12} cy={thinkBubbleY - 14} r={1} fill="#81C784" />
            <Circle cx={thinkBubbleX + 15} cy={thinkBubbleY - 14} r={1} fill="#81C784" />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
}

export default Mascot;
