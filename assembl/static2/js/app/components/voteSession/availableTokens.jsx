// @flow
import React from 'react';
import { Map } from 'immutable';
import { Translate } from 'react-redux-i18n';
import classnames from 'classnames';

import Circle from '../svg/circle';
import { type TokenCategory } from '../../pages/voteSession';

type Props = {
  remainingTokensByCategory: Map<string, number>,
  sticky: boolean,
  tokenCategories: Array<?TokenCategory>
};

const AvailableTokens = ({ remainingTokensByCategory, sticky, tokenCategories }: Props) => (
  <div className={classnames({ 'available-tokens-sticky': sticky, box: sticky, 'available-tokens': !sticky })}>
    {tokenCategories.map((category, idx) => {
      if (category) {
        const { color, id, title, totalNumber } = category;
        const remaining = remainingTokensByCategory.get(category.id);
        const divClass = classnames('category-available-tokens', {
          separator: idx < tokenCategories.length - 1
        });
        return (
          <div key={id} className={divClass}>
            <div className="text">
              <h4 className="dark-title-4">{title}</h4>
              <Translate value="debate.voteSession.remainingTokens" count={remaining} />
            </div>
            <div className="tokens">
              {[...Array(totalNumber).keys()].map(n => (
                <Circle key={n + 1} size="32px" strokeColor={color} fillColor={n + 1 <= remaining ? color : undefined} />
              ))}
            </div>
          </div>
        );
      }

      return null;
    })}
  </div>
);

export default AvailableTokens;