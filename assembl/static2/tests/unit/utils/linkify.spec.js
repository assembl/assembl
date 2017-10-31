import { transformLinksInHtml } from '../../../js/app/utils/linkify';

describe('transformLinksInHtml function', () => {
  it('should transform links in an html string', () => {
    const input = '<p>Foobar http://www.example.com/ and text after</p>';
    const actual = transformLinksInHtml(input);
    const expected =
      '<p>Foobar <a href="http://www.example.com/" class="linkified" ' +
      'target="_blank">http://www.example.com/</a> and text after</p>';
    expect(actual).toEqual(expected);
  });

  it('should turn youtube links into embedded videos', () => {
    const input = '<p>Foobar: https://www.youtube.com/watch?v=foobar</p>';
    const actual = transformLinksInHtml(input);
    const expected =
      '<p>Foobar: <a href="https://www.youtube.com/watch?v=foobar" class="linkified"' +
      ' target="_blank">https://www.youtube.com/watch?v=foobar</a>' +
      '<div><iframe title="" src="https://www.youtube.com/embed/foobar" frameborder="0" allowfullscreen=""></iframe></div></p>';
    expect(actual).toEqual(expected);
  });
});