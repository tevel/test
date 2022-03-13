/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useEffect, memo, useState } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';

import { useInjectReducer } from 'utils/injectReducer';
import { useInjectSaga } from 'utils/injectSaga';
import {
  makeSelectRepos,
  makeSelectLoading,
  makeSelectError,
} from 'containers/App/selectors';
import H2 from 'components/H2';
import Input from './Input';
import Section from './Section';
import messages from './messages';
import { loadRepos } from '../App/actions';
import { changeUsername } from './actions';
import { makeSelectUsername } from './selectors';
import reducer from './reducer';
import saga from './saga';
import request from '../../utils/request';

const key = 'home';

function getUsers() {
  return request('https://6204e645161670001741b018.mockapi.io/api/v1/entities');
}

function buildTree(users) {
  const tree = {users: []};
  users.forEach(user => {
    const path = user.id.split(':');
    let parent = tree;
    for (let i = 0; i < path.length - 2; i++) {
      const org = path[i].trim().replace(/"/g, '').trim();
      if (!parent.hasOwnProperty(org)) {
        parent[org] = {users: []};
      }
      parent = parent[org];
    }
    parent.users.push(user);
  });
  console.log('result data', tree);
  return tree;
}

function formatTree(tree, level = 0, search) {
  const orgs = Object
    .entries(tree)
    .filter(value => value[0] !== 'users');
    // .sort((a,b) => a.length && b.length && a[0].localCompare(b[0]));
  const users = tree.users;//.sort((a,b) => a.displayName.localCompare(b.displayName));
  return (
    <>
      {orgs.map((entry) => (
        <div key={entry[0]} style={{ marginLeft: level * 20 + 'px' }}>
          {entry[0]}
          <div>
            {formatTree(entry[1], level + 1, search)}
          </div>
        </div>
      ))}
      {users.map((user) => (
        <div key={user.id} style={{ marginLeft: level * 20 + 'px', color: 'red' }}>
          {user.displayName}
        </div>
      ))}
    </>
  );
}

export function HomePage() {
  useInjectReducer({ key, reducer });
  useInjectSaga({ key, saga });

  const [tree, setTree] = useState(null);
  const [search, setSearch] = useState('');

  const onSearch = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setSearch(e.target.value);
  };

  useEffect(() => {
    if (!tree) {
      getUsers()
        .then(newUsers => {
          console.log('got data', newUsers);
          try {
            setTree(buildTree(newUsers.entities));
          } catch (e) {
            console.log(e);
            // todo: show error
          }
        })
        .catch(e => {
          console.log(e);
          // todo: show error
        });
    }
  }, []);

  return (
    <article>
      <Helmet>
        <title>Home Page</title>
      </Helmet>
      <div>
        <Section>
          {tree ? (
            <div>
              <H2>
                <FormattedMessage {...messages.trymeHeader} />
              </H2>
              <label htmlFor="search">
                search by id and name:
                <Input
                  id="search"
                  type="text"
                  placeholder=""
                  value={search}
                  onChange={onSearch}
                />
              </label>
              <div style={{display: "grid"}}>
                {formatTree(tree, 0, search)}
              </div>
            </div>
          ) : (
            <div>
              <H2>Loading...</H2>
            </div>
          )}
        </Section>
      </div>
    </article>
  );
}

HomePage.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  repos: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  onSubmitForm: PropTypes.func,
  username: PropTypes.string,
  onChangeUsername: PropTypes.func,
};

const mapStateToProps = createStructuredSelector({
  repos: makeSelectRepos(),
  username: makeSelectUsername(),
  loading: makeSelectLoading(),
  error: makeSelectError(),
});

export function mapDispatchToProps(dispatch) {
  return {
    onChangeUsername: evt => dispatch(changeUsername(evt.target.value)),
    onSubmitForm: evt => {
      if (evt !== undefined && evt.preventDefault) evt.preventDefault();
      dispatch(loadRepos());
    },
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(
  withConnect,
  memo,
)(HomePage);
