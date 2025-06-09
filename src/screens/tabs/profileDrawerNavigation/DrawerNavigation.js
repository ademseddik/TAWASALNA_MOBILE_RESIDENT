import { createDrawerNavigator } from "@react-navigation/drawer";
import { View, TouchableOpacity, Text } from "react-native";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { CommonActions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProfileScreen from "./UserProfile"; 
import HelpScreen from "./HelpScreen";
import UserGroups from "./UserGroups";
import SettingsScreen from "./SettingsScreen";
import Colors from "../../../../assets/Colors";

const Drawer = createDrawerNavigator();

const handleSignOut = async (navigation) => {
  try {
    await AsyncStorage.multiRemove(["userId", "token", "SOCIAL_AUTH"]);
    
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );

    console.log("User signed out successfully");
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props}>
      {/* Render default drawer items */}
      <DrawerItemList {...props} />
      
      {/* Sign-out button */}
      <TouchableOpacity 
        onPress={() => handleSignOut(props.navigation)}
        style={{
          padding: 16,
          backgroundColor: Colors.WHITE,
          borderWidth:2,
          borderColor: Colors.LIGHT_PURPLE,
          borderRadius: 70,
          alignItems: "center",

          margin: 10,
        }}
      >
        <Text style={{ color: Colors.LIGHT_PURPLE, fontWeight: "bold" }}>Sign Out</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

function DrawerNavigation() {
 return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: { backgroundColor: Colors.WHITE }, // Drawer background
        drawerLabelStyle: { color: Colors.LIGHT_GRAY, fontSize: 16, fontWeight: '10',
           drawerActiveBackgroundColor: Colors.LIGHT_PURPLE,
    drawerInactiveBackgroundColor: Colors.GRAY_LIGHT,
         }, // Text styles
      }}
    >
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Help" component={HelpScreen} />
      <Drawer.Screen name="Groups" component={UserGroups} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );

}

export default DrawerNavigation;