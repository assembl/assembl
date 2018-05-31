import React from 'react';
import renderer from 'react-test-renderer';

import Card from '../../../../js/app/components/common/card';

describe('Card component', () => {
  it('should match Card snapshot', () => {
    const rendered = renderer
      .create(
        <Card className="classFoo" imgUrl="http://foo.bar/imgUrl">
          <div>Card content</div>
        </Card>
      )
      .toJSON();
    expect(rendered).toMatchSnapshot();
  });
});