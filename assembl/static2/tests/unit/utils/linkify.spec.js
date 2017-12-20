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

  it('should turn www.youtube.com links into embedded videos', () => {
    const input = '<p>Foobar: https://www.youtube.com/watch?v=lnhB-y_WJSk</p>';
    const actual = transformLinksInHtml(input);
    const expected =
      '<p>Foobar: <a href="https://www.youtube.com/watch?v=lnhB-y_WJSk" class="linkified"' +
      ' target="_blank">https://www.youtube.com/watch?v=lnhB-y_WJSk</a>' +
      '<div><iframe title="" src="https://www.youtube.com/embed/lnhB-y_WJSk" ' +
      'frameborder="0" class="embedded-video" allowfullscreen=""></iframe></div></p>';
    expect(actual).toEqual(expected);
  });

  it('should turn youtube.com links into embedded videos', () => {
    const input = 'Foobar: https://youtube.com/watch?v=lnhB-y_WJSk';
    const actual = transformLinksInHtml(input);
    const expected =
      'Foobar: <a href="https://youtube.com/watch?v=lnhB-y_WJSk" class="linkified"' +
      ' target="_blank">https://youtube.com/watch?v=lnhB-y_WJSk</a>' +
      '<div><iframe title="" src="https://www.youtube.com/embed/lnhB-y_WJSk" frameborder="0" ' +
      'class="embedded-video" allowfullscreen=""></iframe></div>';
    expect(actual).toEqual(expected);
  });

  it('should turn youtu.be links into embedded videos', () => {
    const input = '<p>Foobar: https://youtu.be/lnhB-y_WJSk</p>';
    const actual = transformLinksInHtml(input);
    const expected =
      '<p>Foobar: <a href="https://youtu.be/lnhB-y_WJSk" class="linkified"' +
      ' target="_blank">https://youtu.be/lnhB-y_WJSk</a>' +
      '<div><iframe title="" src="https://www.youtube.com/embed/lnhB-y_WJSk" ' +
      'frameborder="0" class="embedded-video" allowfullscreen=""></iframe></div></p>';
    expect(actual).toEqual(expected);
  });

  it('should handle multiple youtube urls separated by paragraphs', () => {
    const input = '<p>https://www.youtube.com/watch?v=EfJ_pMWpNyM</p><p>…p>https://www.youtube.com/watch?v=n4gmjJ_aPHU</p>';
    const actual = transformLinksInHtml(input);
    const expected =
      '<p><a href="https://www.youtube.com/watch?v=EfJ_pMWpNyM" class="linkified" ' +
      'target="_blank">https://www.youtube.com/watch?v=EfJ_pMWpNyM</a>' +
      '<div><iframe title="" src="https://www.youtube.com/embed/EfJ_pMWpNyM" ' +
      'frameborder="0" class="embedded-video" allowfullscreen=""></iframe></div></p>' +
      '<p>…p><a href="https://www.youtube.com/watch?v=n4gmjJ_aPHU" class="linkified" ' +
      'target="_blank">https://www.youtube.com/watch?v=n4gmjJ_aPHU</a>' +
      '<div><iframe title="" src="https://www.youtube.com/embed/n4gmjJ_aPHU" ' +
      'frameborder="0" class="embedded-video" allowfullscreen=""></iframe></div></p>';
    expect(actual).toEqual(expected);
  });
});