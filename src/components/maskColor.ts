const resolveOpacity = (opacity: number | string, fallback: number) => {
  const value = typeof opacity === 'string' && opacity.trim() === ''
    ? Number.NaN
    : Number(opacity);
  return Number.isFinite(value) ? value : fallback;
};

/** Apply the configured opacity to supported CSS hex and comma-separated RGB colors. */
export const toRgba = (color: string, opacity: number | string): string => {
  if (/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(color)) {
    const hex = color.slice(1);
    const expanded = hex.length <= 4
      ? Array.from(hex, digit => digit + digit).join('')
      : hex;
    const channels = [0, 2, 4].map(index => parseInt(expanded.slice(index, index + 2), 16));
    const alpha = expanded.length === 8 ? parseInt(expanded.slice(6), 16) / 255 : 1;
    return `rgba(${channels.join(',')},${resolveOpacity(opacity, alpha)})`;
  }

  const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)))?\s*\)$/i.exec(color);
  if (rgb) {
    const alpha = rgb[4] == null ? 1 : Number(rgb[4]);
    return `rgba(${rgb.slice(1, 4).join(',')},${resolveOpacity(opacity, alpha)})`;
  }

  return color;
};
