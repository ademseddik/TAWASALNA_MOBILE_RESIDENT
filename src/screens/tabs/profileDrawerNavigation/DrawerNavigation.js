import { createDrawerNavigator } from '@react-navigation/drawer';
import ProfileScreen from './UserProfile'; // Ensure this path is correct
import HelpScreen from './HelpScreen';
import UserGroups from './UserGroups';
import SettingsScreen from './SettingsScreen';

const Drawer = createDrawerNavigator();

function DrawerNavigation() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen 
        name="Profile" // Unique name for the profile screen
        component={ProfileScreen} 
      />
      <Drawer.Screen name="Help" component={HelpScreen} />
      <Drawer.Screen name="Groups" component={UserGroups} />     
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

export default DrawerNavigation;