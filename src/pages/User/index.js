import React, { Component } from 'react';
import { ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';

import api from '../../services/api';

import Container from '../../components/Container';

import {
  Header,
  Avatar,
  Name,
  Bio,
  Stars,
  Starred,
  OwnerAvatar,
  Info,
  Title,
  Author,
  Loading,
  LoadingText,
  LoadingMore,
} from './styles';

export default class User extends Component {
  static navigationOptions = ({ navigation }) => ({
    title: navigation.getParam('user').name,
  });

  static propTypes = {
    navigation: PropTypes.shape({
      getParam: PropTypes.func,
    }).isRequired,
  };

  state = {
    page: 1,
    stars: [],
    loading: false,
    loadingMore: false,
    finished: false,
    refreshing: false,
  };

  async componentDidMount() {
    await this.loadInitial();
  }

  getStarred = async page => {
    try {
      const { navigation } = this.props;
      const user = navigation.getParam('user');

      const response = await api.get(
        `/users/${user.login}/starred?page=${page}`
      );

      return response.data;
    } catch (error) {
      return [];
    }
  };

  loadInitial = async (refresh = false) => {
    const { loading, loadingMore } = this.state;
    if (loading || loadingMore) return;

    const key = refresh ? 'refreshing' : 'loading';

    this.setState({ [key]: true });

    const stars = await this.getStarred(1);

    this.setState({
      stars,
      page: 2,
      loading: false,
      finished: false,
      refreshing: false,
    });
  };

  loadMore = async () => {
    const { loadingMore, finished } = this.state;
    if (loadingMore || finished) return;

    const { page, stars } = this.state;

    this.setState({ loadingMore: true });

    const newStars = await this.getStarred(page);

    this.setState({
      stars: [...stars, ...newStars],
      page: page + 1,
      loadingMore: false,
      finished: newStars.length < 1,
    });
  };

  refreshList = () => {
    this.loadInitial(true);
  };

  handleNavigate = repository => {
    const { navigation } = this.props;

    navigation.navigate('Repository', { repository });
  };

  render() {
    const { navigation } = this.props;
    const { loading, stars, loadingMore, refreshing } = this.state;

    const user = navigation.getParam('user');

    return (
      <Container>
        <Header>
          <Avatar source={{ uri: user.avatar }} />
          <Name>{user.name}</Name>
          <Bio>{user.bio}</Bio>
        </Header>

        {loading ? (
          <Loading>
            <ActivityIndicator color="#7159c1" />
            <LoadingText>Buscando...</LoadingText>
          </Loading>
        ) : (
          <>
            <Stars
              data={stars}
              keyExtractor={star => String(star.id)}
              onRefresh={this.refreshList}
              refreshing={refreshing}
              onEndReachedThreshold={0.2}
              onEndReached={this.loadMore}
              renderItem={({ item }) => (
                <Starred onPress={() => this.handleNavigate(item)}>
                  <OwnerAvatar source={{ uri: item.owner.avatar_url }} />
                  <Info>
                    <Title>{item.name}</Title>
                    <Author>{item.owner.login}</Author>
                  </Info>
                </Starred>
              )}
            />
            {loadingMore && (
              <LoadingMore>
                <ActivityIndicator color="#7159c1" />
                <LoadingText>Buscando...</LoadingText>
              </LoadingMore>
            )}
          </>
        )}
      </Container>
    );
  }
}
