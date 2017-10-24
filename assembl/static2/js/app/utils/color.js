const isHexColorString = (string) => {
  return string.match(/^#([A-Fa-f0-9]{6})$/);
};

export const hexColorToRgba = (colorString, alpha) => {
  if (!isHexColorString(colorString)) return colorString;
  const hex = 16;
  const color = {
    r: parseInt(colorString.slice(1, 3), hex),
    g: parseInt(colorString.slice(3, 5), hex),
    b: parseInt(colorString.slice(5, 7), hex)
  };
  return `rgba(${color.r},${color.g},${color.b},${alpha})`;
};