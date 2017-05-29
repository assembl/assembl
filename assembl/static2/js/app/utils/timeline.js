import { isDateExpired, getNumberOfDays, calculatePercentage } from './globalFunctions';

export const getCurrentPhaseIdentifier = (_timeline) => {
  let timeline = _timeline;
  if (!timeline) {
    timeline = [];
  }
  const currentDate = new Date();
  let identifier = '';
  timeline.forEach((phase) => {
    const startDate = new Date(phase.start);
    const endDate = new Date(phase.end);
    if (currentDate > startDate && currentDate < endDate) {
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

let key = '';
export const isSeveralIdentifiers = (_timeline) => {
  let timeline = _timeline;
  if (!timeline) {
    timeline = [];
  }
  let isSeveral = false;
  timeline.forEach((phase) => {
    if (key !== phase.identifier && key !== '') {
      isSeveral = true;
    }
    key = phase.identifier;
  });
  return isSeveral;
};

export const getPhaseStatus = (_timeline, _identifier) => {
  const identifier = _identifier;
  let timeline = _timeline;
  if (!timeline) {
    timeline = [];
  }
  let status = '';
  const currentDate = new Date();
  timeline.forEach((phase) => {
    const startDate = new Date(phase.start);
    const endDate = new Date(phase.end);
    if (identifier === phase.identifier) {
      if (currentDate < startDate && currentDate < endDate) {
        status = 'notStarted';
      }
      if (currentDate > startDate && currentDate < endDate) {
        status = 'inProgress';
      }
      if (currentDate > startDate && currentDate > endDate) {
        status = 'completed';
      }
    }
  });
  return status;
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