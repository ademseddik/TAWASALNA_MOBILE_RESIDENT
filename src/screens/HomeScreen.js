// src/screens/HomeScreen.js

import React, { useEffect, useState, useCallback } from 'react';
import { Animated, BackHandler, View, Image, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { ProfileService } from '../services/profile.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeSocket } from '../services/WebSocketService'; 
import { initializeChatSocket } from '../utils/initializeChatSocket';
import Colors from '../../assets/Colors';
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

  // --- NEW: useEffect to manage WebSocket connections ---
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
        // This is where your backend sends a signal for a new message
        chatSocketWrapper.subscribe(`/user/${userId}/queue/notifications`, (messageNotification) => {
          console.log('Received new message notification.');
          // You can add a check here if this queue sends other types of notifications
          if (messageNotification.typeNotif === 'MESSAGE') {
            setUnreadNotificationCount(prevCount => prevCount + 1);
          }
        });

      } catch (error) {
        console.error("Failed to setup WebSocket listeners:", error);
      }
    };

    setupAndListen();

    // --- 3. Cleanup Function ---
    // This is crucial to prevent memory leaks and duplicate connections
    return () => {
      console.log("Cleaning up Home screen sockets...");
      if (generalSocketWrapper) {
        generalSocketWrapper.disconnect();
      }
      if (chatSocketWrapper) {
        // Since your chat socket is shared, you might not want to fully disconnect
        // unless the user is logging out. For now, we'll assume disconnecting on screen unload is okay.
        // A more advanced pattern would use a global context to manage the socket lifecycle.
        // chatSocketWrapper.disconnect(); // Comment out if you want it to persist across screens
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
         case 'Chat':
  return <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={24} color={color} />;
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
            setCurrentTab(routeName); // <<< when tab changes, update the header title
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
