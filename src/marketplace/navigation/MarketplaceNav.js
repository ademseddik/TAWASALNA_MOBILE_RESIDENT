import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '../../../assets/Colors';
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
  const navigation = useNavigation();
  
  return (
    <View style={{ flex: 1 }}>
      {/* Return to Home Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.returnButton}
          onPress={() => navigation.navigate('TABBAR')}
          activeOpacity={0.7}
        >
          <FontAwesome name="arrow-left" size={20} color={Colors.LIGHT_PURPLE} />
          <Text style={styles.returnButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab Navigator */}
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: Colors.LIGHT_PURPLE,
          tabBarInactiveTintColor: '#666',
          tabBarIndicatorStyle: {
            backgroundColor: Colors.LIGHT_PURPLE,
            height: 3,
          },
          tabBarStyle: {
            backgroundColor: '#fff',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
        }}
      >
        <Tab.Screen name="Products" component={ProductsScreen} />
        <Tab.Screen name="Services" component={ServicesScreen} />
        <Tab.Screen name="Needs" component={NeedsScreen} />
        {/** Loyalty tab removed */}
      </Tab.Navigator>
    </View>
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

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  returnButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.LIGHT_PURPLE,
  },
}); 