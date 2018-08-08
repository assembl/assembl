import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import * as search from '../../../js/app/components/search';

describe('DumbExtractHit component', () => {
  const { DumbExtractHit } = search;
  it('should render an extract hit', () => {
    const props = {
      bemBlocks: {
        container: name => name,
        item: name => ({
          mix: () => (name ? `div__${name}` : 'div')
        })
      },
      locale: 'en',
      result: {
        _type: 'extract',
        _source: {
          creation_date: '2018-08-08',
          creator_id: 'foo',
          creator_name: 'Jewell Pouros',
          subject_en: 'We need to quantify the optical HTTP panel!',
          body: 'We need to connect the multi-byte SQL interface!'
        }
      }
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbExtractHit {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});