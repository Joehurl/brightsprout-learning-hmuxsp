import React, { useRef, useEffect } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect, G } from 'react-native-svg';

export interface MascotProps {
  size?: number;
  animate?: boolean;
  expression?: 'happy' | 'excited' | 'thinking' | 'celebrating' | 'correct' | 'wrong' | 'sleeping';
  onAnimationComplete?: () => void;
  speechBubble?: string;
}

export function Mascot({
  size = 120,
  animate = true,
  expression = 'happy',
  onAnimationComplete,
  speechBubble,
}: MascotProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const bubbleFloat = useRef(new Animated.Value(0)).current;

  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (animRef.current) {
      animRef.current.stop();
      animRef.current = null;
    }
    translateY.setValue(0);
    translateX.setValue(0);
    rotate.setValue(0);
    scale.setValue(1);

    if (!animate) return;

    let anim: Animated.CompositeAnimation | null = null;

    switch (expression) {
      case 'happy': {
        const bounce = Animated.loop(
          Animated.sequence([
            Animated.timing(translateY, { toValue: -8, duration: 600, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
        );
        const rock = Animated.loop(
          Animated.sequence([
            Animated.timing(rotate, { toValue: -2, duration: 600, useNativeDriver: true }),
            Animated.timing(rotate, { toValue: 2, duration: 600, useNativeDriver: true }),
            Animated.timing(rotate, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
        );
        bounce.start();
        rock.start();
        animRef.current = bounce;
        return () => {
          bounce.stop();
          rock.stop();
        };
      }

      case 'excited': {
        anim = Animated.loop(
          Animated.sequence([
            Animated.timing(translateY, { toValue: -14, duration: 200, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(rotate, { toValue: 360, duration: 400, useNativeDriver: true }),
            Animated.timing(rotate, { toValue: 0, duration: 400, useNativeDriver: true }),
            Animated.delay(200),
          ]),
        );
        break;
      }

      case 'celebrating': {
        anim = Animated.loop(
          Animated.sequence([
            Animated.timing(translateY, { toValue: -30, duration: 300, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(rotate, { toValue: -8, duration: 150, useNativeDriver: true }),
            Animated.timing(rotate, { toValue: 8, duration: 150, useNativeDriver: true }),
            Animated.timing(rotate, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.delay(100),
          ]),
        );
        break;
      }

      case 'correct': {
        anim = Animated.sequence([
          Animated.spring(translateY, { toValue: -20, useNativeDriver: true, damping: 6, stiffness: 200 }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 10, stiffness: 150 }),
        ]);
        anim.start(() => {
          console.log('[Mascot] correct animation complete');
          onAnimationComplete?.();
        });
        animRef.current = anim;
        return;
      }

      case 'wrong': {
        anim = Animated.sequence([
          Animated.timing(translateX, { toValue: 8, duration: 60, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: -8, duration: 60, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 8, duration: 60, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: -8, duration: 60, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 8, duration: 60, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: -8, duration: 60, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]);
        anim.start(() => {
          console.log('[Mascot] wrong animation complete');
          onAnimationComplete?.();
        });
        animRef.current = anim;
        return;
      }

      case 'sleeping': {
        anim = Animated.loop(
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1.0, duration: 1500, useNativeDriver: true }),
          ]),
        );
        break;
      }

      case 'thinking': {
        anim = Animated.loop(
          Animated.sequence([
            Animated.timing(rotate, { toValue: -5, duration: 1000, useNativeDriver: true }),
            Animated.timing(rotate, { toValue: 5, duration: 1000, useNativeDriver: true }),
          ]),
        );
        break;
      }
    }

    if (anim) {
      anim.start();
      animRef.current = anim;
    }

    return () => {
      animRef.current?.stop();
      animRef.current = null;
    };
  }, [animate, expression]);

  // Speech bubble float animation
  useEffect(() => {
    if (!speechBubble) return;
    const floatAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(bubbleFloat, { toValue: -3, duration: 1200, useNativeDriver: true }),
        Animated.timing(bubbleFloat, { toValue: 3, duration: 1200, useNativeDriver: true }),
      ]),
    );
    floatAnim.start();
    return () => floatAnim.stop();
  }, [speechBubble]);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  // ── SVG geometry (120×160 viewBox) ──
  const vw = 120;
  const vh = 160;
  const s = size / 120;

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

  const stemX = 56;
  const stemW = 8;
  const stemTop = 78;
  const stemBottom = potTop;

  const headCx = 60;
  const headCy = 52;
  const headR = 28;

  const armW = 14;
  const armH = 8;
  const armY = 92;
  const leftArmX = stemX - armW - 2;
  const rightArmX = stemX + stemW + 2;

  const eyeY = headCy - 4;
  const leftEyeCx = headCx - 10;
  const rightEyeCx = headCx + 10;
  const eyeR = 6;
  const pupilR = 3.2;
  const shineR = 1.2;

  const cheekY = headCy + 8;
  const leftCheekCx = headCx - 14;
  const rightCheekCx = headCx + 14;

  // ── Mouth paths ──
  const smileHappy = `M${headCx - 10},${headCy + 10} Q${headCx},${headCy + 18} ${headCx + 10},${headCy + 10}`;
  const smileExcited = `M${headCx - 13},${headCy + 8} Q${headCx},${headCy + 22} ${headCx + 13},${headCy + 8}`;
  const smileThinking = `M${headCx - 8},${headCy + 12} Q${headCx + 2},${headCy + 16} ${headCx + 8},${headCy + 12}`;
  const smileCelebrating = smileExcited;
  const smileCorrect = `M${headCx - 11},${headCy + 9} Q${headCx},${headCy + 20} ${headCx + 11},${headCy + 9}`;
  const smileWrong = `M${headCx - 9},${headCy + 16} Q${headCx},${headCy + 10} ${headCx + 9},${headCy + 16}`;
  // sleeping: flat line
  const smileSleeping = `M${headCx - 7},${headCy + 13} Q${headCx},${headCy + 15} ${headCx + 7},${headCy + 13}`;

  const smilePath =
    expression === 'excited' ? smileExcited
    : expression === 'thinking' ? smileThinking
    : expression === 'celebrating' ? smileCelebrating
    : expression === 'correct' ? smileCorrect
    : expression === 'wrong' ? smileWrong
    : expression === 'sleeping' ? smileSleeping
    : smileHappy;

  // ── Eyebrow paths ──
  const leftBrowHappy = `M${leftEyeCx - 5},${eyeY - 8} Q${leftEyeCx},${eyeY - 11} ${leftEyeCx + 5},${eyeY - 8}`;
  const rightBrowHappy = `M${rightEyeCx - 5},${eyeY - 8} Q${rightEyeCx},${eyeY - 11} ${rightEyeCx + 5},${eyeY - 8}`;
  const rightBrowThinking = `M${rightEyeCx - 5},${eyeY - 10} Q${rightEyeCx},${eyeY - 15} ${rightEyeCx + 5},${eyeY - 10}`;
  const leftBrowWrong = `M${leftEyeCx - 5},${eyeY - 6} Q${leftEyeCx},${eyeY - 8} ${leftEyeCx + 5},${eyeY - 10}`;
  const rightBrowWrong = `M${rightEyeCx - 5},${eyeY - 10} Q${rightEyeCx},${eyeY - 8} ${rightEyeCx + 5},${eyeY - 6}`;

  // ── Star eye helper ──
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

  // ── Arm transforms per expression ──
  // celebrating / excited: arms raised up
  const armsRaised = expression === 'celebrating' || expression === 'excited';
  // correct: right arm thumbs up (rotated up), left arm normal
  const armCorrect = expression === 'correct';
  // wrong / sleeping: arms drooped down
  const armsDrooped = expression === 'wrong' || expression === 'sleeping';

  const leftArmRotate = armsRaised
    ? -70
    : armsDrooped
    ? 30
    : armCorrect
    ? -20
    : -20;

  const rightArmRotate = armsRaised
    ? 70
    : armsDrooped
    ? -30
    : armCorrect
    ? -60
    : 20;

  // ── Eye rendering ──
  const showStarEyes = expression === 'excited' || expression === 'celebrating';
  const showClosedEyes = expression === 'sleeping';
  const showWinkRight = expression === 'correct';

  // ── ZZZ bubble for sleeping ──
  const thinkBubbleX = headCx + headR - 4;
  const thinkBubbleY = headCy - headR + 2;

  const svgHeight = size * (vh / vw);

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Speech bubble */}
      {speechBubble ? (
        <Animated.View
          style={[
            styles.speechBubble,
            { transform: [{ translateY: bubbleFloat }], maxWidth: size * 1.6 },
          ]}
        >
          <Text style={styles.speechText}>{speechBubble}</Text>
          {/* Triangle pointer */}
          <View style={styles.speechPointer} />
        </Animated.View>
      ) : null}

      <Animated.View
        style={{
          width: size,
          height: svgHeight,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolate },
            { scale },
          ],
        }}
      >
        <Svg width={size} height={svgHeight} viewBox={`0 0 ${vw} ${vh}`}>
          {/* ── Pot ── */}
          <Path d={potPath} fill="#8B5E3C" />
          <Path
            d={`M${potTopL + 4},${potTop + 4} L${potTopR - 4},${potTop + 4} L${potBotR - 6},${potTop + 14} L${potBotL + 6},${potTop + 14} Z`}
            fill="#A0522D"
            opacity={0.5}
          />
          <Rect x={potTopL - 4} y={potTop - 5} width={potTopW + 8} height={8} rx={4} fill="#A0522D" />

          {/* ── Soil ── */}
          <Ellipse cx={potCx} cy={potTop - 1} rx={potTopW / 2 + 2} ry={5} fill="#6B4226" />

          {/* ── Stem ── */}
          <Rect x={stemX} y={stemTop} width={stemW} height={stemBottom - stemTop} rx={4} fill="#4CAF50" />

          {/* ── Left Leaf ── */}
          <G origin={`${stemX + 2},${stemTop + 20}`} rotation={-30}>
            <Ellipse cx={stemX - 14} cy={stemTop + 20} rx={18} ry={10} fill="#66BB6A" />
            <Path
              d={`M${stemX + 2},${stemTop + 20} L${stemX - 26},${stemTop + 20}`}
              stroke="#4CAF50"
              strokeWidth={1.2}
              strokeLinecap="round"
            />
          </G>

          {/* ── Right Leaf ── */}
          <G origin={`${stemX + stemW - 2},${stemTop + 30}`} rotation={30}>
            <Ellipse cx={stemX + stemW + 14} cy={stemTop + 30} rx={18} ry={10} fill="#66BB6A" />
            <Path
              d={`M${stemX + stemW - 2},${stemTop + 30} L${stemX + stemW + 26},${stemTop + 30}`}
              stroke="#4CAF50"
              strokeWidth={1.2}
              strokeLinecap="round"
            />
          </G>

          {/* ── Arms ── */}
          <Rect
            x={leftArmX}
            y={armY - 3}
            width={armW}
            height={armH}
            rx={4}
            fill="#81C784"
            transform={`rotate(${leftArmRotate}, ${leftArmX + armW / 2}, ${armY + armH / 2})`}
          />
          <Rect
            x={rightArmX}
            y={armY - 3}
            width={armW}
            height={armH}
            rx={4}
            fill="#81C784"
            transform={`rotate(${rightArmRotate}, ${rightArmX + armW / 2}, ${armY + armH / 2})`}
          />

          {/* ── Head ── */}
          <Circle cx={headCx + 2} cy={headCy + 3} r={headR} fill="rgba(0,0,0,0.08)" />
          <Circle cx={headCx} cy={headCy} r={headR} fill="#81C784" />
          <Circle cx={headCx - 8} cy={headCy - 10} r={10} fill="rgba(255,255,255,0.18)" />

          {/* ── Eyebrows ── */}
          {!showStarEyes && !showClosedEyes && (
            <>
              <Path
                d={expression === 'wrong' ? leftBrowWrong : leftBrowHappy}
                stroke="#1A1A2E"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
              />
              {!showWinkRight && (
                <Path
                  d={
                    expression === 'thinking'
                      ? rightBrowThinking
                      : expression === 'wrong'
                      ? rightBrowWrong
                      : rightBrowHappy
                  }
                  stroke="#1A1A2E"
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </>
          )}

          {/* ── Eyes ── */}
          {showStarEyes ? (
            <>
              <Path d={starPath(leftEyeCx, eyeY, eyeR + 1)} fill="#FFD700" />
              <Path d={starPath(rightEyeCx, eyeY, eyeR + 1)} fill="#FFD700" />
              <Circle cx={leftEyeCx - 2} cy={eyeY - 2} r={shineR} fill="#fff" />
              <Circle cx={rightEyeCx - 2} cy={eyeY - 2} r={shineR} fill="#fff" />
            </>
          ) : showClosedEyes ? (
            <>
              {/* Closed eye arcs */}
              <Path
                d={`M${leftEyeCx - eyeR},${eyeY} Q${leftEyeCx},${eyeY - eyeR * 0.8} ${leftEyeCx + eyeR},${eyeY}`}
                stroke="#1A1A2E"
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d={`M${rightEyeCx - eyeR},${eyeY} Q${rightEyeCx},${eyeY - eyeR * 0.8} ${rightEyeCx + eyeR},${eyeY}`}
                stroke="#1A1A2E"
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="none"
              />
            </>
          ) : showWinkRight ? (
            <>
              {/* Left eye normal */}
              <Circle cx={leftEyeCx} cy={eyeY} r={eyeR} fill="#FFFFFF" />
              <Circle cx={leftEyeCx + 1} cy={eyeY + 1} r={pupilR} fill="#1A1A2E" />
              <Circle cx={leftEyeCx - 1} cy={eyeY - 1} r={shineR} fill="#FFFFFF" />
              {/* Right eye wink */}
              <Path
                d={`M${rightEyeCx - eyeR},${eyeY} Q${rightEyeCx},${eyeY - eyeR * 0.9} ${rightEyeCx + eyeR},${eyeY}`}
                stroke="#1A1A2E"
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="none"
              />
            </>
          ) : (
            <>
              <Circle cx={leftEyeCx} cy={eyeY} r={eyeR} fill="#FFFFFF" />
              <Circle cx={rightEyeCx} cy={eyeY} r={eyeR} fill="#FFFFFF" />
              <Circle cx={leftEyeCx + 1} cy={eyeY + 1} r={pupilR} fill="#1A1A2E" />
              <Circle cx={rightEyeCx + 1} cy={eyeY + 1} r={pupilR} fill="#1A1A2E" />
              <Circle cx={leftEyeCx - 1} cy={eyeY - 1} r={shineR} fill="#FFFFFF" />
              <Circle cx={rightEyeCx - 1} cy={eyeY - 1} r={shineR} fill="#FFFFFF" />
            </>
          )}

          {/* ── Rosy Cheeks ── */}
          <Circle cx={leftCheekCx} cy={cheekY} r={6} fill="#FF8A80" opacity={0.4} />
          <Circle cx={rightCheekCx} cy={cheekY} r={6} fill="#FF8A80" opacity={0.4} />

          {/* ── Mouth ── */}
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
              <Circle cx={thinkBubbleX + 9} cy={thinkBubbleY - 14} r={1} fill="#81C784" />
              <Circle cx={thinkBubbleX + 12} cy={thinkBubbleY - 14} r={1} fill="#81C784" />
              <Circle cx={thinkBubbleX + 15} cy={thinkBubbleY - 14} r={1} fill="#81C784" />
            </G>
          )}

          {/* ── ZZZ bubble for sleeping ── */}
          {expression === 'sleeping' && (
            <G>
              <Circle cx={thinkBubbleX + 2} cy={thinkBubbleY - 4} r={2} fill="#FFFFFF" opacity={0.85} />
              <Circle cx={thinkBubbleX + 6} cy={thinkBubbleY - 9} r={3.5} fill="#FFFFFF" opacity={0.85} />
              <Circle cx={thinkBubbleX + 13} cy={thinkBubbleY - 16} r={6} fill="#FFFFFF" opacity={0.85} />
              {/* Z letters */}
              <Path
                d={`M${thinkBubbleX + 10},${thinkBubbleY - 19} L${thinkBubbleX + 16},${thinkBubbleY - 19} L${thinkBubbleX + 10},${thinkBubbleY - 13} L${thinkBubbleX + 16},${thinkBubbleY - 13}`}
                stroke="#81C784"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </G>
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  speechBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 6,
    alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
  },
  speechText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#1A1A2E',
    textAlign: 'center',
  },
  speechPointer: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
});

export default Mascot;
