import { videoUtilities } from '../../../js/app/utils/videoUtilities';

describe('should test if the path is a video file', () => {
  it('should return true if the path is a mp4 video', () => {
    const path = 'http://www.video.fr/videos/video.mp4';
    const result = videoUtilities.pathIsVideoFile(path);
    expect(result).toBe(true);
  });

  it('should return false if the path is embed video', () => {
    const path = 'https://www.youtube.com/embed/8Ot8mNRCLkY';
    const result = videoUtilities.pathIsVideoFile(path);
    expect(result).toBe(false);
  });

  it('should return false if the path is undefined', () => {
    const path = undefined;
    const result = videoUtilities.pathIsVideoFile(path);
    expect(result).toBe(false);
  });

  it('should return false if the path is not a string', () => {
    const path = { foo: 'bar' };
    const result = videoUtilities.pathIsVideoFile(path);
    expect(result).toBe(false);
  });
});