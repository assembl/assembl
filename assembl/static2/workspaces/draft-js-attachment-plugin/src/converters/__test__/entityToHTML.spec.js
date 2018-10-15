// @flow
import TestEditorUtils from 'assembl-test-editor-utils';

import entityToHTML from '../entityToHTML';

describe('entityToHTML function', () => {
  it('should return an img tag for images', () => {
    const entity = TestEditorUtils.createDocumentEntity({
      id: 'foobar',
      mimeType: 'image/png',
      src: 'http://www.example.com/foobar.png',
      title: 'Foobar'
    });
    const expected =
      '<img class="attachment-image" src="http://www.example.com/foobar.png" alt=""' +
      ' title="Foobar" data-id="foobar" data-mimetype="image/png" />';
    const actual = entityToHTML(entity);
    expect(actual).toEqual(expected);
  });

  it('should return the icon for documents (pdf, doc, ...)', () => {
    const entity = TestEditorUtils.createDocumentEntity({
      id: 'foobar',
      mimeType: 'application/pdf',
      src: 'http://www.example.com/document/1122/data',
      title: 'foobar.pdf'
    });
    const expected =
      '<a href="http://www.example.com/document/1122/data" title="foobar.pdf">' +
      '<img class="attachment-icon" alt="pdf" src="/static2/img/icons/black/pdf.svg" data-id="foobar" ' +
      'data-mimetype="application/pdf" data-title="foobar.pdf" ' +
      'data-externalurl="http://www.example.com/document/1122/data" /></a>';
    const actual = entityToHTML(entity);
    expect(actual).toEqual(expected);
  });
});