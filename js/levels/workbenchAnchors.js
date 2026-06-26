export const ASPECT = {
  tester: 6 / 5,
  led: 1159 / 290,
  batteryHolder: 903 / 774,
  switch: 809 / 848,
  potentiometer: 999 / 826,
};

export const TERMINALS = {
  tester: {
    positiveTerminal: { x: 100, y: 33.6 },
    negativeTerminal: { x: 100, y: 71.1 },
  },
  led: {
    anodeTip: { x: 34, y: 99.2 },
    cathodeTip: { x: 68, y: 80.8 },
  },
  batteryHolder: {
    positiveTerminal: { x: 50, y: 8 },
    negativeTerminal: { x: 50, y: 98 },
  },
  switch: {
    pin1Tip: { x: 29.2, y: 99 },
    pin2Tip: { x: 75, y: 99 },
  },
  potentiometer: {
    pin1Tip: { x: 25.3, y: 99 },
    pin2Tip: { x: 50, y: 99 },
    pin3Tip: { x: 74.7, y: 99 },
  },
};
