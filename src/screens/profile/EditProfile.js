import * as ImagePicker from "expo-image-picker";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from "react-native";
const { width, height } = Dimensions.get("window");
import { EvilIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../../../assets/Colors";
import { encode } from "base64-arraybuffer";
import { RadioButton } from "react-native-paper";
import Toast from "react-native-toast-message";
import SuccessUpdatingProfile from "../../components/pupUps/SuccessUpdatingProfile";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { APP_ENV } from "../../../src/utils/BaseUrl";
import Axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { useUser } from '@clerk/clerk-expo';
import { Picker } from '@react-native-picker/picker';
import { ScrollView } from 'react-native-gesture-handler';



const EditProfile = () => {
  //////////////////////////////////////////////////////////////////////
  const [selectedImage, setSelectedImage] = useState("https://i.ibb.co/73SntSb/profileimage.jpg");
  const [coverImage, setCoverImage] = useState("https://i.ibb.co/Zqy4r4F/profile-photo.jpg");

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [residentId, setResidentId] = useState("");
  const [address, setAddress] = useState("");
  const [data, setData] = useState([]);
  const [errorFullName, setErrorFullName] = useState(false);
  const [errorBio, setErrorBio] = useState(false);
  const [lengthBio, setlengthBio] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [shouldUpdatePicture, setShouldUpdatePicture] = useState(false);
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [interests, setInterests] = useState([]);
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [errorAddress, setErrorAddress] = useState("");
  const [errorAge, setErrorAge] = useState("");
  const [errorResidentId, setErrorResidentId] = useState("");
  const { user } = useUser();
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [UserID, setUserID] = useState('');
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [communityError, setCommunityError] = useState('');
  const [isSocialAuth, setIsSocialAuth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  //////////////////////////////////////////////////////////////////////
  const handleCloseSubmit = () => {
    setModalVisible(false);
  };
  const handlechangepassword = () => {
    console.log("hello")
    navigation.navigate("change password");
  };

  const handleOpenSubmit = () => {
    setModalVisible(true);
  };
  const interestsData = [
    { id: 1, name: "TRAVEL" },
    { id: 2, name: "PHOTOGRAPHY" },
    { id: 3, name: "FOOD" },
    { id: 4, name: "SPORTS" },
    { id: 5, name: "MUSIC" },
    { id: 6, name: "TECHNOLOGY" },
  ];
  const handleInterestPress = (interestName) => {
    const updatedInterests = interests.includes(interestName)
      ? interests.filter((item) => item !== interestName)
      : [...interests, interestName];
    setInterests(updatedInterests);
  };

  const showToastSuccess = () => {
    Toast.show({
      type: "success",
      position: "top",
      text1: "Success Updating",
      text2: "Your informations updated successfully!",
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 20,
      bottomOffset: 40,
    });
    //navigation.navigate("ProfileScreen");
  };

  useEffect(() => {
    const fetchUserAndCommunities = async () => {
      try {
        setIsLoadingCommunities(true);

        const userId = await AsyncStorage.getItem("userId");
        const userResponse = await Axios.get(`${APP_ENV.AUTH_PORT}/tawasalna-user/user/${userId}`);
        console.log(userResponse)
        const userCommunityId = userResponse?.data?.community?.id;

        // Then fetch all communities
        const communitiesResponse = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/community/findAll`);
        const allCommunities = communitiesResponse.data;

        // Set states
        setCommunities(allCommunities);

        // Preselect user's community in the picker
        if (userCommunityId) {
          setSelectedCommunity(userCommunityId);
        }

      } catch (error) {
        setCommunityError('Failed to load communities');
        console.error('Error fetching communities or user:', error);
      } finally {
        setIsLoadingCommunities(false);
      }
    };

    fetchUserAndCommunities();
  }, []);
  //////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (shouldUpdatePicture) {
      UpdateProfilePicture();
      setShouldUpdatePicture(false);
    }
  }, [shouldUpdatePicture]);

  const handleImageSelection = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    console.log(result);


    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      console.log("Selected Image URI:", result.assets[0].name);
      if (selectedImage !== result.assets[0].uri) {
        setShouldUpdatePicture(true);
      }
    } else {
      console.log("Image selection canceled");
    }
    console.log("Current selected image:", selectedImage);
  };
  //////////////////////////////////Update the cover picture //////////
  const handleCoverImageSelection = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [3, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const newUri = result.assets[0].uri;
      setCoverImage(newUri); // For UI update
      console.log(`Selected new cover URI: ${newUri}`);
      UpdateCoverPicture(newUri); // Pass the new URI directly
    }
  };

  const UpdateCoverPicture = async (imageUri) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("USER_ACCESS");

      const formData = new FormData();
      formData.append("coverPhoto", {
        uri: imageUri, // Use passed-in URI
        name: "cover.jpg",
        type: "image/jpeg",
      });

      const res = await Axios.put(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/updatecoverpictures/${userId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Toast.show({
        type: "success",
        position: "top",
        text1: "Cover Updated",
        text2: "Your cover picture has been updated.",
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error("Error uploading cover photo:", error);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Upload Failed",
        text2: "Something went wrong while updating your cover.",
      });
    }
  };



  ////////////////////////////////////////////////////////////////
  const OnchangeBio = (event) => {
    if (event.length > 300) {
      setErrorBio("Bio cannot exceed 300 characters.")
      setlengthBio("")

    } else {
      setlengthBio(`${event.length} /300`)
      setErrorBio("")
    }
    setBio(event);
  };
  const OnchangeFullName = (event) => {
    setFullName(event);
  };
  const OnchangeAdress = (event) => {
    setAddress(event);
  };
  const OnchangeAge = (text) => {
    const parsedValue = text.trim() !== "" ? parseFloat(text) : "";
    setAge(parsedValue);
  };
  const OnchangeResidentId = (text) => {
    const parsedValue = text.trim() !== "" ? parseFloat(text) : "";
    setResidentId(text);
  };

  ///////////////////////////////////////////////////////////////////////////
  const fetchProfile = useCallback(async () => {
    const socialAuth = await AsyncStorage.getItem("SOCIAL_AUTH");
    setIsSocialAuth(socialAuth === 'true'); // Add this line

    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("token"); // Retrieve token
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include token in headers
          },
        }
      );
      setData(response.data);
      const residentProfile = response.data;
      if (response.data.profilephoto) {
        setSelectedImage(response.data.profilephoto);
      }
      if (response.data.coverphoto) {
        setCoverImage(response.data.coverphoto);
      }

      setFullName(residentProfile.fullName);
      if (!residentProfile.bio) {
        console.log("Bio is empty in the profile data");
      } else {
        setBio(residentProfile.bio);
      }
      if (residentProfile.age !== null) {
        setAge(residentProfile.age.toString());
      }
      if (residentProfile.gender !== null) {
        setGender(residentProfile.gender.toString());
      }
      if (!residentProfile.address) {
        console.log("Address is empty in the profile data");
      } else {
        setAddress(residentProfile.address);
      }
      if (!residentProfile.residentId) {
        console.log("Resident ID is empty in the profile data");
      } else {
        setResidentId(residentProfile.residentId);
      }
      if (residentProfile.dateOfBirth !== null) {
        const dob = new Date(residentProfile.dateOfBirth);
        const formattedDate = dob.toISOString().split("T")[0];
        setDateOfBirth(formattedDate);
      } else {
        setDateOfBirth("");
      }
      setInterests(residentProfile.interests || []);
    } catch (error) {
      console.error("Error getting resident profile:", error);
      throw new Error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  ///////////////////////////////////////////////////////////////////////
  const UpdateProfile = async () => {
    let hasError = false;

    if (!fullName.trim()) {
      setErrorFullName("Full name is required!");
      hasError = true;
    } else if (fullName.length < 5) {
      setErrorFullName("Full name must be at least 5 characters long!");
      hasError = true;
    } else {
      setErrorFullName("");
    }

    if (bio.length < 5) {
      setErrorBio("Bio must be at least 5 characters long!");
      hasError = true;
    } else {
      setErrorBio("");
    }

    if (!address.trim()) {
      setErrorAddress("Address is required!");
      hasError = true;
    } else {
      setErrorAddress("");
    }

    if (!age || isNaN(age) || parseInt(age) < 1) {
      setErrorAge("Valid age is required!");
      hasError = true;
    } else {
      setErrorAge("");
    }

    if (!residentId || isNaN(residentId)) {
      setErrorResidentId("Valid Resident ID is required!");
      hasError = true;
    } else {
      setErrorResidentId("");
    }

    if (hasError) return;
    setIsSubmitting(true);
    try {
      const userId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("token");

      await Axios.put(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/updateresidenprofile/${userId}`,
        {

          residentId,
          fullName,
          address,
          age,
          gender,
          dateOfBirth: new Date(dateOfBirth),
          bio,
          interests,
          selectedCommunity
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await Axios.put(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/community/${selectedCommunity}/userAdd/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      fetchProfile();
      showToastSuccess();

      navigation.navigate("TABBAR", { screen: "Profile" });
    } catch (error) {
      navigation.navigate("TABBAR", { screen: "Profile" });
    } finally {
      setIsSubmitting(false);  // Add this line
    }
  };
  /////////////////////////////////////////////////////////////////////////
  const UpdateProfilePicture = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("token"); // Retrieve token
      if (!selectedImage) {
        console.log("No profile photo selected");
        return;
      }
      const response = await fetch(selectedImage);


      const formData = new FormData();
      formData.append("profilePhoto", {
        uri: selectedImage,
        name: "profile_photo.jpg",
        type: "image/jpeg",
      });

      await Axios.put(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/updateprofilepictures/${userId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`, // Include token
          },
        }
      );
      console.log("Update Image successful");
      fetchProfilePhoto();
    } catch (error) {

      throw new Error(error);
    }
  };
  ////////////////////////////////////////////////////////////////////////////
  const fetchProfilePhoto = async () => {
    if (user) {
      await user.reload();

      console.log("photo uri is " + user.imageUrl)

    } else {


    }
    setIsLoading(true);
    try {
      // const userId = await AsyncStorage.getItem("userId");
      // const token = await AsyncStorage.getItem("token"); // Retrieve token
      // const response = await Axios.get(
      //   `tawasalna-community/residentprofile/getprofilephoto/${userId}`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`, // Include token
      //     },
      //     responseType: "arraybuffer",
      //   }
      // );

      // const base64Image = encode(response.data);
      // const imageUrl = user.imageUrl;
      setSelectedImage(user.imageUrl);
    } catch (error) {

    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchProfilePhoto();
  }, []);

  /////////////////////////////////////////////////////////////////
  const toggleDatePicker = () => {
    setShowPicker(!showPicker);
  };

  const onchangeDatePicker = (event, selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1
        }-${selectedDate.getDate()}`;
      setDateOfBirth(formattedDate);
    }
    setShowPicker(false);
  };
  //////////////////////////////////////////////////////////////////
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            borderRadius: 50,
            width: 90,
            height: 90,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={Colors.PURPLE} />
        </View>
      </View>
    );
  }
  //////////////////////////////////////////////////////////////////

  return (
    <View style={styles.lastCont}>
        <View style={styles.bigContainer}>
          <View style={styles.profileHeaderWrapper}>
            <View style={{ marginBottom: 20 }}>
              <Image
                source={{ uri: coverImage }}
                style={{
                  width: width,
                  height: 200,
                  resizeMode: "cover",
                }}
              />
              <TouchableOpacity
                onPress={handleCoverImageSelection}
                style={{
                  position: "absolute",
                  bottom: 10,
                  right: 10,
                  backgroundColor: Colors.WHITE,
                  padding: 5,
                  paddingTop: 2, // Reduced padding
                  borderRadius: 20,
                  elevation: 3,
                }}
              >
                <EvilIcons name="camera" size={25} color={Colors.LIGHT_PURPLE} />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarWrapper}>
              <Image source={{ uri: selectedImage }} style={styles.avatar} />
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleImageSelection()}
              >
                <EvilIcons name="camera" size={25} color={Colors.LIGHT_PURPLE} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView

            contentContainerStyle={styles.containerInput}
            nestedScrollEnabled
          >
            <Text
              style={styles.label2}
            >
              {t("FullName")}
            </Text>
            <TextInput
              placeholder="Full name"
              value={fullName}
              onChangeText={OnchangeFullName}
              style={styles.input}
              keyboardType="default"
            />
            {errorFullName ? (
              <Text
                style={styles.label}
              >
                {errorFullName}
              </Text>
            ) : null}

            <Text
              style={styles.label2}
            >
              {t("Date Of Birth")}
            </Text>
            <View style={{ flexDirection: "row" }}>
              {showPicker ? (
                <DateTimePicker
                  mode="date"
                  display="spinner"
                  value={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowPicker(false);
                    setDateOfBirth(selectedDate.toDateString());
                  }}
                />
              ) : (
                <TouchableOpacity
                  onPress={toggleDatePicker}
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <TextInput
                    placeholder="Date Of Birth"
                    value={dateOfBirth}
                    style={styles.input}
                    editable={false}
                    keyboardType="default"
                  />
                  <MaterialCommunityIcons
                    name="calendar"
                    size={24}
                    color="black"
                    style={{ marginLeft: -35 }}
                  />
                </TouchableOpacity>
              )}
            </View>
            <Text
              style={styles.label2}
            >
              {t("Bio")}
            </Text>
            <TextInput
              style={[styles.input, { maxHeight: 120, textAlignVertical: 'top', maxWidth: 300 }]} // make it taller and text start from top
              value={bio}
              onChangeText={OnchangeBio}
              placeholder="Bio"
              multiline
            />
            {errorBio ? <Text style={styles.errorText}>{errorBio}</Text> : null}
            {lengthBio ? <Text style={styles.lengthBio}>{lengthBio}</Text> : null}
            <Text
              style={styles.label2}
            >
              {t("Address")}
            </Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={OnchangeAdress}
              placeholder="Address"
            />
            {errorAddress ? <Text style={styles.errorText}>{errorAddress}</Text> : null}
            <Text
              style={styles.label2}
            >
              {t("Age")}
            </Text>


            <TextInput
              style={styles.input}
              value={age.toString()}
              onChangeText={OnchangeAge}
              placeholder="Age"
              keyboardType="numeric"
            />
            {errorAge ? <Text style={styles.errorText}>{errorAge}</Text> : null}
            <Text
              style={styles.label2}
            >
              {t("Resident ID")}
            </Text>
            <TextInput
              style={styles.input}
              value={residentId.toString()}
              onChangeText={OnchangeResidentId}
              placeholder="Resident ID"
              keyboardType="numeric"
            />
            {errorResidentId ? <Text style={styles.errorText}>{errorResidentId}</Text> : null}

            <View style={styles.genderCont}>
              <Text style={styles.label2}>{t("Gender")}</Text>
              <View style={styles.nestedRadio}>
                <View style={styles.radioButton}>
                  <RadioButton
                    value="Male"
                    status={gender === "MALE" ? "checked" : "unchecked"}
                    onPress={() => setGender("MALE")}
                    color="#6200EE"
                  />
                  <Text>{t("MALE")}</Text>
                </View>
                <View style={styles.radioButton}>
                  <RadioButton
                    value="Female"
                    status={gender === "FEMALE" ? "checked" : "unchecked"}
                    onPress={() => setGender("FEMALE")}
                    color="#6200EE"
                  />
                  <Text>{t("FEMALE")}</Text>
                </View>
              </View>
            </View>
            <View style={{ marginTop: 15 }}>
              <Text style={styles.label3}>
                {t("Community")}

              </Text>
              <View
                style={{
                  borderWidth: 1,
                  borderRadius: 8,
                  borderColor: communityError ? 'red' : 'gray',
                  width: 310,

                  marginBottom: 1,
                }}
              >
                {isLoadingCommunities ? (
                  <ActivityIndicator size="small" color={Colors.PURPLE} />
                ) : (
                  <Picker
                    selectedValue={selectedCommunity}
                    onValueChange={(itemValue) => {
                      setSelectedCommunity(itemValue);
                      setCommunityError('');
                    }}
                    style={{ color: Colors.BLACK }}
                  >
                    <Picker.Item label={t("Select a community")} value="" />
                    {communities.map((community) => (
                      <Picker.Item
                        key={community.id}
                        label={community.name}
                        value={community.id}
                      />
                    ))}
                  </Picker>
                )}
              </View>
              {communityError && (
                <Text style={{ color: 'red', marginLeft: '3%' }}>{communityError}</Text>
              )}
            </View>
            <View style={styles.interestsContainer}>
              {interestsData.map((interest) => (
                <TouchableOpacity
                  key={interest.id}
                  style={[
                    styles.interestButton,
                    interests.includes(interest.name) &&
                    styles.selectedInterest,
                  ]}
                  onPress={() => handleInterestPress(interest.name)}
                >
                  <Text
                    style={[
                      interests.includes(interest.name) && styles.selectedText,
                    ]}
                  >
                    {t(interest.name)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>


          </ScrollView>
        <View style={{ height: '20%',marginBottom:10 ,alignContent:"center" ,width:'100%'}}>
 <TouchableOpacity onPress={handleOpenSubmit} style={[styles.button, { height: 50,marginBottom:10,alignItems:"center",alignSelf:'center' }]}>
            <Text style={styles.textBtn}>{t("Save")}</Text>
          </TouchableOpacity>
        </View>
         
        </View>
        <SuccessUpdatingProfile
          handleCloseSubmit={handleCloseSubmit}
          modalVisible={modalVisible}
          showToastSuccess={showToastSuccess}
          onConfirm={UpdateProfile}
          isSubmitting={isSubmitting}
        />

    </View>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  lastCont: {

    backgroundColor: "white",
    flex: 1,
  },
  profileHeaderWrapper: {
    position: "relative",
    width: "100%",
    height: 200, // Adjust height as needed
    backgroundColor: "#f0f0f0",
    marginBottom: 60, // space below the avatar
  },

  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  avatarWrapper: {
    position: "absolute",
    bottom: -55,
    alignSelf: "center",
    alignItems: "center",
  },

  avatar: {
    width: 100,
    height: 100,

    borderColor: "white",
  },

  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#8A2BE2", // or any color you like
    padding: 6,
    borderRadius: 20,
    elevation: 3,
  },


  containerPhoto: {
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
    height: height * 0.3,
    width: width * 0.9,
    flexDirection: "column",
    gap: 15,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 20,
    marginTop: 50,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,

  },
  editButton: {
    position: "absolute",
    bottom: -3,
    right: 4,
    backgroundColor: Colors.WHITE,
    padding: 5,
    paddingTop: 2, // Reduced padding
    borderRadius: 20,
    elevation: 3,
  },
  image: {
    borderRadius: 100,
    height: height * 0.15,
    width: width * 0.3,
    padding: 1,
    borderWidth: 4,
    borderColor: "#BA479B",
  },
  picker: {
    borderRadius: 100,
    backgroundColor: "#BA479B",
    height: height * 0.03,
    width: width * 0.06,
    justifyContent: "center",
    alignContent: "center",
    position: "absolute",
    top: 105,
    right: 125,
  },
  iconContainer: {
    justifyContent: "center",
    alignContent: "center",
    paddingLeft: 1.5,
  },
  ligne: {
    width: width * 0.9,
    height: height * 0.001,
    backgroundColor: "#5a5959",
  },
  containerText: {
    justifyContent: "center",
    alignItems: "center",
  },
  textOne: {
    fontWeight: "bold",
    fontSize: 22,
  },
  textTwo: {
    color: "#5a5959",
    fontSize: 18,
  },
  containerInput: {
    gap: 10,
    padding: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 5,
    maxWidth: 300,
    width: width * 0.9,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  lengthBio: {
    color: Colors.GRAY,
    marginBottom: 3,
    alignSelf: "flex-end",
    alignContent: "flex-end",
    end: 20,
  },
  containerNested: {
    flexDirection: "column",
    justifyContent: "space-between",
    width: width * 0.9,
    maxWidth: 300
  },
  nestedInputesOne: {
    flex: 1,
    marginRight: 10,
  },
  nestedInputesTwo: {
    flex: 1,
    marginLeft: 10,
  },
  genderCont: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingEnd: 12,
    marginTop: 5,
  },
  gender: {
    marginRight: 20,
  },
  nestedRadio: {
    flexDirection: "row",
    justifyContent: "space-around",
    flex: 1,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  textBtnchangepassword: {
    color: Colors.LIGHT_PURPLE,
    fontWeight: "bold",
    fontSize: 20,
  },
  lastCont: {

    backgroundColor: "white",
    flex: 1,
  },
  bigContainer: {

    justifyContent: "flex-end",
    alignItems: "center",
    gap: 5,
    height: height * 1,
    backgroundColor: "white",

  },
  containerInput: {
    justifyContent: "center",
    alignItems: "center",
  },

  label: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  label2: {
    fontWeight: "bold",
    color: "black", marginLeft: 30,
    marginBottom: 5,
    marginLeft: 40,
    alignSelf: "flex-start"
  },
  label3: {
    fontWeight: "bold",
    color: "black",
    marginBottom: 5,
    marginLeft: 3,
    alignSelf: "flex-start"
  },

  button: {
    backgroundColor: Colors.LIGHT_PURPLE,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
    width: "90%",

  },
  textBtn: {
    color: "white",
    fontWeight: "bold",
    fontSize: 20,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 16,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    marginLeft: 20,
  },
  interestButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    margin: 5,
  },
  selectedInterest: {
    backgroundColor: Colors.LIGHT_PURPLE,
  },
  selectedText: {
    color: "white",
  },
});
