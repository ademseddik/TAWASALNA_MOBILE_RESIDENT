import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import ProductsScreen from '../screens/ProductsScreen';
import ServicesScreen from '../screens/ServicesScreen';
import NeedsScreen from '../screens/NeedsScreen';
import AddProductScreen from '../screens/AddProductScreen';
import AddNeedScreen from '../screens/AddNeedScreen';
import UserProductsDashboard from '../screens/UserProductsDashboard';
import UserNeedsDashboard from '../screens/UserNeedsDashboard';
import EditProductScreen from '../screens/EditProductScreen';
import EditNeedScreen from '../screens/EditNeedScreen';

const Tab = createMaterialTopTabNavigator();
const Stack = createStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="Services" component={ServicesScreen} />
      <Tab.Screen name="Needs" component={NeedsScreen} />
      {/** Loyalty tab removed */}
    </Tab.Navigator>
  );
}

export default function MarketplaceNav() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="MarketplaceTabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddNeed" component={AddNeedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="UserProductsDashboard" component={UserProductsDashboard} options={{ headerShown: false }} />
      <Stack.Screen name="UserNeedsDashboard" component={UserNeedsDashboard} options={{ headerShown: false }} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ headerShown: false }} />
      <Stack.Screen name='EditNeed' component={EditNeedScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
} 