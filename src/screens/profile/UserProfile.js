import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { EvilIcons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../../../assets/Colors";
import Axios from "axios";
import { useTranslation } from "react-i18next";
import { APP_ENV } from "../../../src/utils/BaseUrl";
import { encode } from "base64-arraybuffer";
import { useOAuth, useAuth, useUser } from '@clerk/clerk-expo';
import CompleteInformations from "../../components/pupUps/CompleteInformations";
const { width, height } = Dimensions.get("window");

const ProfileScreen = ({ navigation }) => {
  const {user } = useUser(); // User data from Clerk
  const { signOut } = useAuth();

  const { t } = useTranslation();
  const [profileData, setProfileData] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState("https://i.ibb.co/73SntSb/profileimage.jpg");
  const [loading, setLoading] = useState(true);
  const [isCompleteInformationsModalVisible, setCompleteInformationsModalVisible] = useState(false);


  const toggleCompleteInformationsModal = () => {
    setCompleteInformationsModalVisible(!isCompleteInformationsModalVisible);
  };
  const fetchProfileData = async () => {
   
    try {
      const userId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("token");
     
      const hideCompleteInformations = await AsyncStorage.getItem("hideCompleteInformations");
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
    
        // Merge the two
        const mergedData = {
          ...residentData,
          community: userCommunity
        };
        setProfilePhoto(residentData.profilephoto); // Use residentData instead of profileData
        setProfileData(mergedData);
    

  
      if(!response.data.dateOfBirth)
          setCompleteInformationsModalVisible(!isCompleteInformationsModalVisible);
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  };


  const handleSignOut = async () => {
    try {
      await signOut();
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out eror:', error);
    }

    try {
     
      await AsyncStorage.multiRemove(["userId", "token","SOCIAL_AUTH"]);


      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Login" }],
        })
      );
    } catch (error) {
      console.error("Error signing out:", error);
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

      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
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
          {profileData?.residentId && (
            <Text style={styles.residentId}>ID: {profileData.residentId}</Text>
          )}
        </View>
      </View>
      <CompleteInformations
        isVisible={isCompleteInformationsModalVisible}
        onClose={toggleCompleteInformationsModal}
      />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("About Me")}</Text>
        <Text style={styles.sectionContent}>
          {profileData?.bio || t("No bio availabe")}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("Personal Information")}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t("Age")}:</Text>
          <Text style={styles.infoValue}>{profileData?.age || "-"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t("Gender")}:</Text>
          <Text style={styles.infoValue}>
            {profileData?.gender ? t(profileData.gender) : "-"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t("Date of Birth")}:</Text>
          <Text style={styles.infoValue}>
            {profileData?.dateOfBirth ?
              new Date(profileData.dateOfBirth).toLocaleDateString()
              : "-"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t("Address")}:</Text>
          <Text style={styles.infoValue}>
            {profileData?.address || t("No address provided")}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("Interests")}</Text>
        <View style={styles.interestsContainer}>
          {profileData?.interests?.map((interest, index) => (
            <View key={index} style={styles.interestTag}>
              <Text style={styles.interestText}>{t(interest)}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("Community")}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t("Community name")}:</Text>
          <Text style={styles.infoValue}>{profileData?.community || "-"}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>{t("Sign Out")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 20,
    marginTop: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.LIGHT_PURPLE,
  },
  editButton: {
    position: "absolute",
    bottom: -2,
    right: 4,
    backgroundColor: Colors.LIGHT_PURPLE,
    padding: 8, // Reduced padding
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
  section: {
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
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.RED,
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  signOutText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ProfileScreen;