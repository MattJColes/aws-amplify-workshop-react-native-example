import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, Button, TextInput } from 'react-native';
import React from 'react';
import { API, graphqlOperation, Analytics, Auth, Storage } from 'aws-amplify'
import { listRestaurants } from './src/graphql/queries'
import { createRestaurant } from './src/graphql/mutations'
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid'
const CLIENTID = uuid()
import Amplify from 'aws-amplify';
import config from './src/aws-exports';
import { withAuthenticator } from 'aws-amplify-react-native';

Amplify.configure(config);

class App extends React.Component {
  // define some state to hold the data returned from the API
  state = {
    name: '', description: '', city: '', restaurants: [], coins: []
  }
  async componentDidMount() {
    // Added some better user error handling
    try {
      const user = await Auth.currentAuthenticatedUser()
      // console.log('user:', user)
    } catch (err) {
      console.log('error fetching user...', err)
    }
    // execute the restaurant query in componentDidMount
    try {
      const restaurantData = await API.graphql(graphqlOperation(listRestaurants))
      //console.log('restaurantData:', restaurantData)
      this.setState({
        restaurants: restaurantData.data.listRestaurants.items
      })
    } catch (err) {
      console.log('error fetching restaurants...', err)
    }
    try {
      const data = await API.get('cryptoapi', '/coins?limit=5&start=100')
      //console.log('data from Lambda REST API: ', data)
      this.setState({ coins: data.coins })
    } catch (err) {
      console.log('error fetching coin data...', err)
    }
  }
  // this method calls the API and creates the mutation
  recordEvent = () => {
    Analytics.record({
      name: 'My test event',
      attributes: {
        username: this.state.username
      }
    })
  }
  addToStorage = () => {
    Storage.put('textfiles/mytext.txt', `Hello World`)
      .then (result => {
        console.log('result: ', result)
      })
      .catch(err => console.log('error: ', err));
  }
  readFromStorage = () => {
    Storage.list('textfiles/')
      .then(data => console.log('data from S3: ', data))
      .catch(err => console.log('error fetching from S3', err))
  }
  createRestaurant = async() => {
    const { name, description, city  } = this.state
    // store the restaurant data in a variable
    const restaurant = {
      name, description, city, clientId: CLIENTID
    }
    // perform an optimistic response to update the UI immediately
    const restaurants = [...this.state.restaurants, restaurant]
    this.setState({
      restaurants,
      name: '', description: '', city: ''
      })
    try {
      // make the API call
      await API.graphql(graphqlOperation(createRestaurant, {
        input: restaurant
      }))
      console.log('item created!')
    } catch (err) {
      console.log('error creating restaurant...', err)
    }
  }
  // change form state then user types into input
  onChange = (key, value) => {
    this.setState({ [key]: value })
  }
  signOut = () => {
    Auth.signOut()
      .then(() => this.props.onStateChange('signedOut'))
      .catch(err => console.log('err: ', err))
  }
  render() {
    return (
      <SafeAreaView style={styles.container}>
        <Button onPress={this.readFromStorage} title='Read Storage' />
        <Button onPress={this.addToStorage} title='Add to Storage' />
        <Button onPress={this.recordEvent} title='Record Event' />
        <View>
        {
          this.state.coins.map((c, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.name}>{c.name}</Text>
              <Text>{c.price_usd}</Text>
            </View>
          ))
        }
      </View>
        <TextInput
          style={{ height: 50, margin: 5, backgroundColor: "#ddd" }}
          onChangeText={v => this.onChange('name', v)}
          value={this.state.name} placeholder='name'
        />
        <TextInput
          style={{ height: 50, margin: 5, backgroundColor: "#ddd" }}
          onChangeText={v => this.onChange('description', v)}
          value={this.state.description} placeholder='description'
        />
        <TextInput
          style={{ height: 50, margin: 5, backgroundColor: "#ddd" }}
          onChangeText={v => this.onChange('city', v)}
          value={this.state.city} placeholder='city'
        />
        <Button onPress={this.createRestaurant} title='Create Restaurant' />
        {
          this.state.restaurants.map((restaurant, index) => (
            <View key={index} style={styles.item}>
              <Text style={styles.name}>{restaurant.name}</Text>
              <Text style={styles.description}>{restaurant.description}</Text>
              <Text style={styles.city}>{restaurant.city}</Text>
            </View>
          ))
        }
        <Button onPress={this.signOut} title="Sign Out"/>
      </SafeAreaView>
    )
  }
}

export default withAuthenticator(App, {
  includeGreetings: true
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  item: { padding: 10 },
  name: { fontSize: 20 },
  description: { fontWeight: '600', marginTop: 4, color: 'rgba(0, 0, 0, .5)' },
  city: { marginTop: 4 }
})
