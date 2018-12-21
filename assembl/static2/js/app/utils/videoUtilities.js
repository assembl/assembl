// https://en.wikipedia.org/wiki/Video_file_format
const videoExtensions = [
  'webm',
  'mkv',
  'flv',
  'vob',
  'ogv',
  'ogg',
  'drc',
  'gif',
  'gifv',
  'mng',
  'avi',
  'mov',
  'qt',
  'wmv',
  'yuv',
  'rm',
  'rmvb',
  'asf',
  'amv',
  'mp4',
  'm4p',
  'm4v',
  'mpg',
  'mp2',
  'mpeg',
  'mpe',
  'mpv',
  'mpg',
  'mpeg',
  'm2v',
  'm4v',
  'svi',
  '3gp',
  '3g2',
  'mxf',
  'roq',
  'nsv',
  'f4v',
  'f4p',
  'f4a',
  'f4b'
];

// TODO get the MIME-TYPE from url metadata
export const videoUtilities = {
  pathIsVideoFile: (path) => {
    if (!path || typeof path !== 'string') return false;
    const components = path.split('/');
    const file = components[components.length - 1].split('.');
    const extension = file[file.length - 1];
    return videoExtensions.includes(extension);
  }
};