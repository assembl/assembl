import moment from 'moment';

export const mockPhasesPresets = [
  {
    id: 1,
    labelTranslationKey: 'administration.export.presets.phase',
    range: {
      startDate: moment(20190101, 'YYYYMMDD'),
      endDate: moment(20190120, 'YYYYMMDD')
    },
    type: 'phase'
  },
  {
    id: 2,
    labelTranslationKey: 'administration.export.presets.phase',
    range: {
      startDate: moment(20190121, 'YYYYMMDD'),
      endDate: moment(20190226, 'YYYYMMDD')
    },
    type: 'phase'
  },
  {
    id: 3,
    labelTranslationKey: 'administration.export.presets.phase',
    range: {
      startDate: moment(20190227, 'YYYYMMDD'),
      endDate: moment(20190315, 'YYYYMMDD')
    },
    type: 'phase'
  }
];