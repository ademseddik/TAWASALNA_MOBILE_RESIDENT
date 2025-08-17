// src/screens/HomeScreen.js

import React, { useEffect, useState, useCallback } from 'react';
import { Animated, BackHandler, View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { ProfileService } from '../services/profile.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeSocket } from '../services/WebSocketService'; 
import { initializeChatSocket } from '../utils/initializeChatSocket';
import Colors from '../../assets/Colors';
import Axios from 'axios';
import { APP_ENV } from '../utils/BaseUrl';
// Screenss
import Home from './tabs/HomeScreen';
import Search from './tabs/SearchScreen';
import Conversations from './tabs/Conversations';

import Notifications from './tabs/ReelScreen';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import ProfileDrawerWrapper from './tabs/profileDrawerNavigation/ProfileDrawerWrapper'; 

const Tab = createBottomTabNavigator();



const HomeScreen = ({ route }) => {
  const [scrollY] = useState(new Animated.Value(0));
  const [profilePhoto, setProfilePhoto] = useState("https://i.ibb.co/73SntSb/profileimage.jpg");
  const [initialTab] = useState(route.params?.initialTab || "Home");
  const [currentTab, setCurrentTab] = useState(initialTab); // <<< NEW
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // --- WebSocket connections for notification counter ---
  useEffect(() => {
    let generalSocketWrapper = null;
    let chatSocketWrapper = null;

    const setupAndListen = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          console.log("No user ID found, aborting socket setup.");
          return;
        }

        // --- 1. Connect to the General Notification Socket ---
        generalSocketWrapper = await initializeSocket();
        
        const handleNewGeneralNotification = (notification) => {
          console.log('Received general notification:', notification.type);
          // Increment the unread count for new notifications
          setUnreadNotificationCount(prevCount => prevCount + 1);
        };
        
        // Listen to all relevant general notification types
        generalSocketWrapper.on('followRequest', handleNewGeneralNotification);
        generalSocketWrapper.on('followNotification', handleNewGeneralNotification);
        generalSocketWrapper.on('likePostNotification', handleNewGeneralNotification);
        generalSocketWrapper.on('commentNotification', handleNewGeneralNotification);
        generalSocketWrapper.on('replyToCommentNotification', handleNewGeneralNotification);
        generalSocketWrapper.on('reactionOnCommentNotification', handleNewGeneralNotification);
        generalSocketWrapper.on('groupInvitation', handleNewGeneralNotification);

        // --- 2. Connect to the Chat Message Socket ---
        chatSocketWrapper = await initializeChatSocket();

        // Subscribe to the user's personal notification queue for new messages
        chatSocketWrapper.subscribe(`/user/${userId}/queue/notifications`, (messageNotification) => {
          console.log('Received new message notification.');
          if (messageNotification.typeNotif === 'MESSAGE') {
            setUnreadNotificationCount(prevCount => prevCount + 1);
          }
        });

      } catch (error) {
        
      }
    };

    setupAndListen();

    // --- Cleanup Function ---
    return () => {
      console.log("Cleaning up Home screen sockets...");
      if (generalSocketWrapper) {
        generalSocketWrapper.disconnect();
      }
      if (chatSocketWrapper) {
        // chatSocketWrapper.disconnect(); // Uncomment if you want to disconnect on screen unload
      }
    };
  }, []); 
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

  const fetchInitialNotificationCount = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      
      // Fetch notifications from the new backend endpoint
      const response = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/findNotificationsForUser/${userId}?page=0&size=100`);
      
      const notificationsData = response.data.content || [];
      
      // Count only unread notifications
      const unreadCount = notificationsData.filter(notification => !notification.read).length;
      
      setUnreadNotificationCount(unreadCount);
    } catch (error) {
      console.error("Error fetching initial notification count:", error);
    }
  };

  const refreshNotificationCount = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      
      // Fetch notifications from the new backend endpoint
      const response = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/findNotificationsForUser/${userId}?page=0&size=100`);
      
      const notificationsData = response.data.content || [];
      
      // Count only unread notifications
      const unreadCount = notificationsData.filter(notification => !notification.read).length;
      
      setUnreadNotificationCount(unreadCount);
    } catch (error) {
      console.error("Error refreshing notification count:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchProfileData();
      await fetchInitialNotificationCount();
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

      // Refresh notification count when screen comes into focus
      refreshNotificationCount();

      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [])
  );


  

  




  return (
    <GestureHandlerRootView style={{ flex: 1 }}>

    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>

      <Tab.Navigator
        initialRouteName={initialTab}
        screenOptions={({ route, navigation }) => ({
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
         case 'Chat':
  return <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={24} color={color} />;
                case 'Notifications':
                  return (
                    <View style={{ position: 'relative' }}>
                      <MaterialCommunityIcons name="bell-outline" size={24} color={color} />
                      {unreadNotificationCount > 0 && (
                        <View style={{
                          position: 'absolute',
                          top: -5,
                          right: -5,
                          backgroundColor: '#FF4444',
                          borderRadius: 10,
                          minWidth: unreadNotificationCount > 99 ? 24 : 20,
                          height: 20,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderWidth: 2,
                          borderColor: '#fff',
                          paddingHorizontal: 2
                        }}>
                          <Text style={{
                            color: '#fff',
                            fontSize: unreadNotificationCount > 99 ? 8 : 10,
                            fontWeight: 'bold'
                          }}>
                            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
              case 'Profile':
                return (
                  <Image
                    source={{ uri: profilePhoto }}
                    style={{
                      width: focused ? 30 : 26,
                      height: focused ? 30 : 26,
                      borderRadius: 15,
                      borderWidth: focused ? 2 : 1,
                      borderColor: focused ? Colors.LIGHT_PURPLE : 'gray',
                    }}
                  />
                );
              default:
                return null;
            }
          },
          tabBarActiveTintColor:  Colors.LIGHT_PURPLE,
          tabBarInactiveTintColor: 'gray',
        })}
        screenListeners={{
          state: (e) => {
            const index = e.data.state.index;
            const routeName = e.data.state.routeNames[index];
            setCurrentTab(routeName);
            
            // Refresh notification counter when user visits Notifications tab
            if (routeName === 'Notifications') {
              refreshNotificationCount();
            }
          },
        }}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Search" component={Search} />
        <Tab.Screen name="Chat" component={Conversations} />
        <Tab.Screen name="Notifications" component={Notifications} />
       <Tab.Screen name="Profile" component={ProfileDrawerWrapper} />
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
