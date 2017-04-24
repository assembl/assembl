import { isDateExpired, getNumberOfDays, calculatePercentage } from './globalFunctions';

export const getCurrentPhaseIdentifier = (_timeline) => {
  let timeline = _timeline;
  if (!timeline) {
    timeline = [];
  }
  const currentDate = new Date();
  let identifier = null;
  timeline.forEach((phase) => {
    const startDate = new Date(phase.start);
    const endDate = new Date(phase.end);
    if (isDateExpired(currentDate, startDate) && isDateExpired(endDate, currentDate)) {
      identifier = phase.identifier;
    }
  });
  return identifier || 'thread';
};

export const isPhaseStarted = (_timeline, _identifier) => {
  let timeline = _timeline;
  const identifier = _identifier;
  if (!timeline) {
    timeline = [];
  }
  const currentDate = new Date();
  let isStarted = false;
  timeline.forEach((phase) => {
    if (phase.identifier === identifier) {
      const startDate = new Date(phase.start);
      isStarted = isDateExpired(currentDate, startDate);
    }
  });
  return isStarted;
};

export const getStartDatePhase = (_timeline, _identifier) => {
  let timeline = _timeline;
  if (!timeline) {
    timeline = [];
  }
  const identifier = _identifier;
  let startDatePhase = '';
  timeline.forEach((phase) => {
    if (phase.identifier === identifier) {
      startDatePhase = phase.start;
    }
  });
  return startDatePhase;
};

export const isCurrentPhase = (_phase) => {
  const phase = _phase;
  const currentDate = new Date();
  const startDate = new Date(phase.start);
  const endDate = new Date(phase.end);
  const currentPhase = isDateExpired(currentDate, startDate) && isDateExpired(endDate, currentDate);
  return currentPhase;
};

export const getPhaseName = (_timeline, _identifier, _locale) => {
  let timeline = _timeline;
  if (!timeline) {
    timeline = [];
  }
  const identifier = _identifier;
  const locale = _locale;
  let phaseName = '';
  timeline.forEach((phase) => {
    if (phase.identifier === identifier) {
      phase.title.entries.forEach((entry) => {
        if (entry['@language'] === locale) {
          phaseName = entry.value;
        }
      });
    }
  });
  return phaseName;
};

export const isStepCompleted = (_phase) => {
  const phase = _phase;
  const currentDate = new Date();
  const endDate = new Date(phase.end);
  return isDateExpired(currentDate, endDate);
};

export const getIfPhaseCompletedByIdentifier = (_timeline, _identifier) => {
  let timeline = _timeline;
  if (!timeline) {
    timeline = [];
  }
  const identifier = _identifier;
  let isPhaseCompleted = false;
  timeline.forEach((phase) => {
    if (identifier === phase.identifier) {
      isPhaseCompleted = isStepCompleted(phase);
    }
  });
  return isPhaseCompleted;
};

export const getBarWidth = (_phase) => {
  const phase = _phase;
  const currentDate = new Date();
  const endDate = new Date(phase.end);
  const stepCompleted = isDateExpired(currentDate, endDate);
  let barWidth = 0;
  if (stepCompleted) {
    barWidth = 100;
  } else {
    const startDate = new Date(phase.start);
    const isStepStarted = isDateExpired(currentDate, startDate);
    if (isStepStarted) {
      const remainingDays = getNumberOfDays(endDate, currentDate);
      const totalDays = getNumberOfDays(endDate, startDate);
      const percentage = calculatePercentage(remainingDays, totalDays);
      barWidth = 100 - percentage;
    }
  }
  return barWidth;
};