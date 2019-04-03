import moment from 'moment';

export const mockPhasesPresets = [
  {
    id: 1,
    labelTranslationKey: 'administration.export.presets.phase',
    range: {
      startDate: moment('2019-01-01 13:00:00'),
      endDate: moment('2019-01-20 13:00:00')
    },
    type: 'phase'
  },
  {
    id: 2,
    labelTranslationKey: 'administration.export.presets.phase',
    range: {
      startDate: moment('2019-01-21 13:00:00'),
      endDate: moment('2019-02-26 13:00:00')
    },
    type: 'phase'
  },
  {
    id: 3,
    labelTranslationKey: 'administration.export.presets.phase',
    range: {
      startDate: moment('2019-02-27 13:00:00'),
      endDate: moment('2019-03-15 13:00:00')
    },
    type: 'phase'
  }
];