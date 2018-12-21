// @flow
/*
Wrapper component for react-final-form that loads data from server (graphql query) then
normalize this data to form values.
When user submit the form, form values are "transformed" in graphql mutations.
save function is expected to return a status ()

This component is inspired by React Final Form Example - Load, Save, and Reinitialize
https://github.com/final-form/react-final-form#loading-normalizing-saving-and-reinitializing
*/
import * as React from 'react';
import { type Mutator } from 'final-form';
import { Form } from 'react-final-form';

import type { MutationsPromises, SaveStatus } from './types.flow';

type TOriginalValues = {| [string]: any |};

export type TInitialValues = { [string]: any };

type Props = {
  load: (fetchPolicy: FetchPolicy) => Promise<TOriginalValues>,
  loading: React.Node,
  postLoadFormat: ?(TOriginalValues) => TInitialValues,
  createMutationsPromises: (TInitialValues, TInitialValues) => MutationsPromises,
  save: MutationsPromises => Promise<SaveStatus>,
  afterSave?: TInitialValues => void,
  mutators?: { [string]: Mutator }
};

type State = {
  initialValues: ?TInitialValues,
  isLoading: boolean,
  originalValues: ?TOriginalValues
};

export default class LoadSaveReinitializeForm extends React.Component<Props, State> {
  state = {
    isLoading: false,
    originalValues: undefined,
    initialValues: undefined
  };

  componentDidMount() {
    this.load();
  }

  load = async (fetchPolicy: FetchPolicy = 'cache-first') => {
    const { load, postLoadFormat } = this.props;
    this.setState({ isLoading: true });
    const originalValues = await load(fetchPolicy);
    const initialValues = postLoadFormat ? postLoadFormat(originalValues) : originalValues;
    this.setState({
      isLoading: false,
      initialValues: initialValues
    });
  };

  save = async (values: TInitialValues) => {
    const { createMutationsPromises, save, afterSave } = this.props;
    if (this.state.initialValues) {
      const mutationPromises = createMutationsPromises(values, this.state.initialValues);
      const status = await save(mutationPromises);
      if (status === 'OK') {
        // we really need to do a refetch to have the correct new ids in values
        await this.load('network-only');
        if (afterSave) afterSave(values);
      }
    }
  };

  render() {
    const { load, loading, postLoadFormat, createMutationsPromises, save, ...rest } = this.props;
    const { isLoading, initialValues } = this.state;
    return isLoading || !initialValues ? loading : <Form {...rest} initialValues={initialValues} onSubmit={this.save} />;
  }
}