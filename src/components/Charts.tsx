import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Polyline, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../constants/colors';

// ─── Geometry helpers ────────────────────────────────────────────────────────

/** SVG polar point. Angle in degrees, y-down coordinate system. */
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** Arc path between two angles (degrees, y-down). */
function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, start);
  const e = polar(cx, cy, r, end);
  const large = Math.abs(end - start) > 180 ? 1 : 0;
  const sweep = end > start ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} ${sweep} ${e.x} ${e.y}`;
}

// ─── Semicircle Gauge ────────────────────────────────────────────────────────

interface SemiGaugeProps {
  size: number;
  strokeWidth?: number;
  /** 0..1 fraction of the top semicircle to fill (left → right) */
  progress: number;
  progressColor?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

/**
 * A 180° gauge arcing over the top. Center content (e.g. a big number)
 * is rendered via `children`, absolutely centered under the arc.
 */
export function SemiGauge({
  size,
  strokeWidth = 10,
  progress,
  progressColor = Colors.accentBlue,
  trackColor = Colors.track,
  children,
}: SemiGaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - strokeWidth / 2;
  const clamped = Math.max(0, Math.min(1, progress));
  const svgHeight = size / 2 + strokeWidth / 2;

  return (
    <View style={{ width: size, height: svgHeight }}>
      <Svg width={size} height={svgHeight}>
        <Path
          d={arcPath(cx, cy, r, 180, 360)}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={arcPath(cx, cy, r, 180, 180 + clamped * 180)}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      {children != null && (
        <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
      )}
    </View>
  );
}

// ─── Progress Ring (near-full circle) ────────────────────────────────────────

interface ProgressRingProps {
  size: number;
  strokeWidth?: number;
  progress: number;
  progressColor?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

/** Full-circle progress ring, starting at the top and going clockwise. */
export function ProgressRing({
  size,
  strokeWidth = 8,
  progress,
  progressColor = Colors.success,
  trackColor = Colors.track,
  children,
}: ProgressRingProps) {
  const r = size / 2 - strokeWidth / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children != null && (
        <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
      )}
    </View>
  );
}

// ─── Sparkline (line + soft area fill) ───────────────────────────────────────

interface SparklineProps {
  data: number[];
  width: number;
  height: number;
  color?: string;
  showDots?: boolean;
}

/** Small upward trend line with a faded area beneath it. */
export function Sparkline({
  data,
  width,
  height,
  color = Colors.accentBlue,
  showDots = false,
}: SparklineProps) {
  const pad = 4;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const lineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaStr =
    `M ${points[0].x} ${height} ` +
    points.map((p) => `L ${p.x} ${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x} ${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.22} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={areaStr} fill="url(#sparkFill)" />
      <Polyline
        points={lineStr}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots &&
        points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={2.6} fill={color} />
        ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
