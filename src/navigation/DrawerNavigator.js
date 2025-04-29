import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '../screens/HomeScreen';
import { Text } from 'react-native';

const Drawer = createDrawerNavigator();

const DummyScreen = ({ title }) => (
  <Text style={{ margin: 50, fontSize: 20 }}>{title}</Text>
);

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,  // we don't want headers
      }}
    >
      <Drawer.Screen name="HomeTabs" component={HomeScreen} />
      {/* Example additional screens in the drawer */}
      <Drawer.Screen name="Settings" children={() => <DummyScreen title="Settings" />} />
      <Drawer.Screen name="Notifications" children={() => <DummyScreen title="Notifications" />} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
