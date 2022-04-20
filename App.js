import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, Button, TextInput } from 'react-native';
import React from 'react';
import { Auth, API, graphqlOperation } from 'aws-amplify';
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
    name: '', description: '', city: '', restaurants: []
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
      console.log('restaurantData:', restaurantData)
      this.setState({
        restaurants: restaurantData.data.listRestaurants.items
      })
    } catch (err) {
      console.log('error fetching restaurants...', err)
    }
  }
  // this method calls the API and creates the mutation
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
