import { List, Map } from 'immutable';

import * as voteSessionAdmin from '../../../js/app/pages/voteSessionAdmin';
import '../../helpers/setupTranslations';

describe('getProposalValidationErrors', () => {
  const { getProposalValidationErrors } = voteSessionAdmin;
  it('should return at least one module validation error', () => {
    const proposal = Map({
      _isNew: true,
      _toDelete: false,
      _hasChanged: false,
      errors: [],
      id: 'my-invalid-proposal',
      titleEntries: List.of(
        Map({
          localeCode: 'en',
          value: 'Foo'
        })
      ),
      modules: List()
    });
    const actual = getProposalValidationErrors(proposal, 'en');
    expect(actual).toMatchSnapshot();
  });

  it('should return title is required validation error if there is no value for editLocale', () => {
    const proposal = Map({
      _isNew: true,
      _toDelete: false,
      _hasChanged: false,
      errors: [],
      id: 'my-invalid-proposal',
      titleEntries: List.of(
        Map({
          localeCode: 'en',
          value: 'Foo'
        })
      ),
      modules: List.of(
        Map({
          id: 'my-module',
          _toDelete: false
        })
      )
    });
    const actual = getProposalValidationErrors(proposal, 'fr');
    expect(actual).toMatchSnapshot();
  });

  it('should return title is required validation error if titleEntries is empty', () => {
    const proposal = Map({
      _isNew: true,
      _toDelete: false,
      _hasChanged: false,
      errors: [],
      id: 'my-invalid-proposal',
      titleEntries: List(),
      modules: List.of(
        Map({
          id: 'my-module',
          _toDelete: false
        })
      )
    });
    const actual = getProposalValidationErrors(proposal, 'en');
    expect(actual).toMatchSnapshot();
  });
});