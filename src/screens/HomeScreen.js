// src/screens/HomeScreen.js

import React, { useEffect, useState, useCallback } from 'react';
import { Animated, BackHandler, View, Image, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { ProfileService } from '../services/profile.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Screens
import Home from './tabs/HomeScreen';
import Search from './tabs/SearchScreen';
import AddPost from './tabs/AddPost';

import Notifications from './tabs/ReelScreen';
import Profile from './profile/UserProfile';
import HelpScreen from './screenstotest/HelpScreen';
import UserGroups from './screenstotest/UserGroups';
import SettingsScreen from './screenstotest/SettingsScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createDrawerNavigator } from '@react-navigation/drawer';
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();


const HomeScreen = ({ route }) => {
  const [scrollY] = useState(new Animated.Value(0));
  const [profilePhoto, setProfilePhoto] = useState("https://i.ibb.co/73SntSb/profileimage.jpg");
  const [initialTab] = useState(route.params?.initialTab || "Home");
  const [currentTab, setCurrentTab] = useState(initialTab); // <<< NEW

  const fetchProfileData = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("token");
      const response = await ProfileService.GetProfileData({
        userId: userId,
        token: token,
      });
      if (response.profilephoto) {
        setProfilePhoto(response.profilephoto);
      }
      console.log(response);
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchProfileData();
    };
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [])
  );


  
  const screens = [
    { name: 'Profile', component: Profile },
    { name: 'Help', component: HelpScreen },
    { name: 'Settings', component: SettingsScreen },
    { name: 'Groups', component: UserGroups },
  ];
  
  const ProfileDrawer = () => {
    return (
      <Drawer.Navigator
        screenOptions={{
          headerShown: false,
          drawerActiveTintColor: Colors.PURPLE,
          drawerInactiveTintColor: Colors.GRAY,
          drawerLabelStyle: { fontWeight: 'bold' },
        }}
      >
        {screens.map((screen, index) => (
          <Drawer.Screen key={index} name={screen.name} component={screen.component} />
        ))}
      </Drawer.Navigator>
    );
  };

  const renderCustomHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{currentTab}</Text>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>

    <View style={{ flex: 1 }}>

      <Tab.Navigator
        initialRouteName={initialTab}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 0.5,
            borderTopColor: '#ccc',
          },
          tabBarIcon: ({ focused, color, size }) => {
            switch (route.name) {
              case 'Home':
                return <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />;
              case 'Search':
                return <Feather name="search" size={24} color={color} />;
              case 'Add':
                return <Ionicons name="add-circle-outline" size={28} color={color} />;
                case 'Notifications':
                  return <MaterialCommunityIcons name="bell-outline" size={24} color={color} />;
              case 'Profile':
                return (
                  <Image
                    source={{ uri: profilePhoto }}
                    style={{
                      width: focused ? 30 : 26,
                      height: focused ? 30 : 26,
                      borderRadius: 15,
                      borderWidth: focused ? 2 : 1,
                      borderColor: focused ? 'black' : 'gray',
                    }}
                  />
                );
              default:
                return null;
            }
          },
          tabBarActiveTintColor: 'black',
          tabBarInactiveTintColor: 'gray',
        })}
        screenListeners={{
          state: (e) => {
            const index = e.data.state.index;
            const routeName = e.data.state.routeNames[index];
            setCurrentTab(routeName); // <<< when tab changes, update the header title
          },
        }}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Search" component={Search} />
        <Tab.Screen name="Add" component={AddPost} />
        <Tab.Screen name="Notifications" component={Notifications} />
        <Tab.Screen name="Profile" component={ProfileDrawer} />
      </Tab.Navigator>
    </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 80,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop:10
  },
});

export default HomeScreen;
