import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { EvilIcons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../../../../assets/Colors";
import Axios from "axios";
import { useTranslation } from "react-i18next";
import { APP_ENV } from "../../../utils/BaseUrl";
import { useAuth, useUser } from '@clerk/clerk-expo';
import CompleteInformations from "../../../components/pupUps/CompleteInformations";
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import InfoRoute from '../../profile/InfoRoute';
import FriendsRoute from '../../profile/FriendsRoute';
import PostsRoute from '../../profile/PostsRoute';
import { ScrollView } from 'react-native-virtualized-view';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Modal from 'react-native-modal';


const initialLayout = { width: Dimensions.get('window').width };

const ProfileScreen = ({ navigation }) => {
  const [userId, setuserId] = useState(null);
  const [index, setIndex] = useState(0);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const [routes] = useState([

    { key: 'posts', title: 'Posts' },
    { key: 'friends', title: 'Friends' },
    { key: 'info', title: 'Info' },
  ]);

  const renderScene = SceneMap({
    
    posts:  () => <PostsRoute userId={userId} />,
    friends: () => <FriendsRoute userId={userId} navigation={navigation}  />,
    info: () => <InfoRoute userId={userId} />,
  });


  const { t } = useTranslation();
  const [profileData, setProfileData] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState("https://i.ibb.co/3LTQjg6/20250604-1540-White-Background-Change-remix-01jwxp43eefkss1zrbgf7gqqyb.png");
  const [coverImage, setCoverImage] = useState("https://i.ibb.co/3LTQjg6/20250604-1540-White-Background-Change-remix-01jwxp43eefkss1zrbgf7gqqyb.png");

  const [loading, setLoading] = useState(true);
  const [isCompleteInformationsModalVisible, setCompleteInformationsModalVisible] = useState(false);
  const [isQRModalVisible, setQRModalVisible] = useState(false);


  const toggleCompleteInformationsModal = () => {
    setCompleteInformationsModalVisible(!isCompleteInformationsModalVisible);
  };

  const toggleBio = () => setIsBioExpanded(prev => !prev);

  const openQRModal = () => setQRModalVisible(true);
  const closeQRModal = () => setQRModalVisible(false);


  const fetchProfileData = async () => {

    try {
      const userId = await AsyncStorage.getItem("userId");
      setuserId(userId)
      const token = await AsyncStorage.getItem("token");

      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const userinformations = await Axios.get(
        `${APP_ENV.AUTH_PORT}/tawasalna-user/user/${userId}`);

      const residentData = response.data;
      const userCommunity = userinformations.data?.community?.name || null;
    
      const privacySetting = userinformations.data.residentProfile.accountType;
      // Save to AsyncStorage
      if (privacySetting !== undefined) {
        await AsyncStorage.setItem("PRIVACY", String(privacySetting));
      }
    AsyncStorage.setItem("USERCOMMUNITY", userinformations.data?.community?.id)
      // Merge the two
      const mergedData = {
        ...residentData,
        community: userCommunity
      };
      if (residentData.profilephoto) {
        setProfilePhoto(residentData.profilephoto); // Use residentData instead of profileData

      }
      if (residentData.coverphoto) {
        setCoverImage(residentData.coverphoto);
      }

      setProfileData(mergedData);



      if (!response.data.dateOfBirth)
        setCompleteInformationsModalVisible(!isCompleteInformationsModalVisible);
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  };



  useEffect(() => {
    const loadData = async () => {
      await fetchProfileData();


      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PURPLE} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>

   <View style={styles.profileHeaderWrapper}>
  <View style={styles.coverImageWrapper}>
  
    <Image source={{ uri: coverImage }} style={styles.coverImage} />
    {/* QR Code Button */}
    <TouchableOpacity
      style={styles.qrButton}
      onPress={openQRModal}
    >
      <Ionicons name="qr-code-outline" size={28} color={Colors.LIGHT_PURPLE} />
    </TouchableOpacity>
  </View>
  
  <View style={styles.avatarWrapper}>
    <Image source={{ uri: profilePhoto }} style={styles.avatar} />
    <TouchableOpacity
      style={styles.editButton}
      onPress={() => navigation.navigate("Edit profile")}
    >
      <EvilIcons name="pencil" size={24} color="white" />
    </TouchableOpacity>
  </View>

  <View style={styles.profileInfo}>
    <Text style={styles.name}>{profileData?.fullName || ""}</Text>
   
    {profileData?.bio && (
  <TouchableOpacity onPress={toggleBio}>
    <Text style={styles.bio}>
      {profileData.bio.length > 50 && !isBioExpanded
        ? `${profileData.bio.slice(0, 50)}...`
        : profileData.bio}
      {profileData.bio.length > 50 && (
        <Text style={{ color: Colors.LIGHT_PURPLE,fontSize:14 }}>
          {isBioExpanded ? " Show less" : " Read more"}
        </Text>
      )}
    </Text>
  </TouchableOpacity>
)}

  </View>
</View>
      <CompleteInformations
        isVisible={isCompleteInformationsModalVisible}
        onClose={toggleCompleteInformationsModal}
      />
      <Modal
        isVisible={isQRModalVisible}
        onBackdropPress={closeQRModal}
        onBackButtonPress={closeQRModal}
        style={styles.qrModal}
      >
        <View style={styles.qrModalContent}>
          <Text style={styles.qrModalTitle}>{t('Share your profile')}</Text>
          {userId && (
            <QRCode
              value={userId}
              size={180}
            />
          )}
          <Text style={styles.qrModalInstruction}>
            {t('To share your profile, ask a friend to go to the Search screen and tap the QR code scanner to scan this code and find your profile.')}
          </Text>
          <TouchableOpacity style={styles.qrModalCloseButton} onPress={closeQRModal}>
            <Text style={styles.qrModalCloseButtonText}>{t('Close')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      <View style={{ flex: 1, height: Dimensions.get('window').height * 0.85 }}>

        <TabView
              style={{ flex: 1 }}
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={initialLayout}
          overScrollMode={"always"}
          renderTabBar={props => (
            <TabBar
              {...props}
              indicatorStyle={{ backgroundColor: "white" ,height:3}}
              style={{ backgroundColor: Colors.LIGHT_PURPLE,elevation:30}}

              renderLabel={({ route }) => (
                <Text style={{
                  color: 'black',
                  fontWeight: 'bold',
                  textShadowColor: 'black',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 0,
                }}>
                  {route.title}
                </Text>
              )}
            />
          )}
        />
      </View>


    

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
 
   
  },
  menuButton: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 1,
    padding: 8,
  },
  signOutIcon: {
    width: 24,
    height: 24,
  },
  coverImageWrapper: {
    position: "relative",
    width: "100%",
  },

  signOutButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: Colors.RED,
    padding: 8,
    borderRadius: 20,
    zIndex: 1, // Ensure it's above the image
  },
  signOutText: {
    color: 'white',
    fontWeight: 'bold',
  },

  coverImage: { width: "100%", height: 180},

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  profileHeaderWrapper: {
    marginBottom: 30,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  scene: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  

  avatarContainer: {
    position: "relative",
    marginBottom: 20,
    marginTop: -10
  },
  avatar: {
    position: "relative",
    width: 120,
    height: 120,
    borderRadius: 60,
    marginTop: -70,

    borderColor: Colors.LIGHT_PURPLE,
  },
  editButton: {
    position: "absolute",
    bottom: -2,
    right: 4,
    backgroundColor: Colors.LIGHT_PURPLE,
    padding: 8,
    borderRadius: 20,
    elevation: 3,
  },
  editButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  profileInfo: {
    alignItems: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  residentId: {
    fontSize: 16,
    color: Colors.GRAY,
  },
  bio: {
    fontSize: 16,
    fontWeight:300,
    marginLeft:10,
    color: Colors.LIGHT_BLACK,
    maxWidth: 300,
  },
  section: {
    marginRight: 10,
    marginLeft: 10,
    marginBottom: 25,
    backgroundColor: Colors.LIGHT_WHITE,
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: Colors.PURPLE,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.DARK_GRAY,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.DARK_GRAY,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: Colors.LIGHT_GRAY,
    flexShrink: 1,
    maxWidth: "60%",
    textAlign: "right",
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  interestTag: {
    backgroundColor: Colors.LIGHT_PURPLE,
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  interestText: {
    color: "white",
    fontSize: 14,
  },
 
  qrButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    elevation: 4,
    zIndex: 2,
  },
  qrModal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  qrModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  qrModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.PURPLE,
  },
  qrModalInstruction: {
    marginTop: 20,
    fontSize: 15,
    color: Colors.DARK_GRAY,
    textAlign: 'center',
    marginBottom: 16,
  },
  qrModalCloseButton: {
    marginTop: 10,
    backgroundColor: Colors.LIGHT_PURPLE,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  qrModalCloseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;