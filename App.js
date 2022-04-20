import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, Button, TextInput } from 'react-native';
import React from 'react';
import { Auth } from 'aws-amplify'
import Amplify from 'aws-amplify';
import config from './src/aws-exports';
import { withAuthenticator } from 'aws-amplify-react-native';

Amplify.configure(config);

class App extends React.Component {
  async componentDidMount() {
    const user = await Auth.currentAuthenticatedUser()
    console.log('user:', user)
  }
  signOut = () => {
    Auth.signOut()
      .then(() => this.props.onStateChange('signedOut'))
      .catch(err => console.log('err: ', err))
  }
  render() {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Hello World</Text>
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
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
