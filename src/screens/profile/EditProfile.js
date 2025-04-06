import * as ImagePicker from "expo-image-picker";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
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
import {  useUser } from '@clerk/clerk-expo';




const EditProfile = () => {
  //////////////////////////////////////////////////////////////////////
  const [selectedImage, setSelectedImage] = useState(null);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [residentId, setResidentId] = useState("");
  const [address, setAddress] = useState("");
  const [data, setData] = useState([]);
  const [errorFullName, setErrorFullName] = useState(false);
  const [errorBio, setErrorBio] = useState(false);
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
  //////////////////////////////////////////////////////////////////////
  const handleCloseSubmit = () => {
    setModalVisible(false);
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
      console.log("Selected Image URI:", result.assets[0].uri);
      if (selectedImage !== result.assets[0].uri) {
        setShouldUpdatePicture(true);
      }
    } else {
      console.log("Image selection canceled");
    }
    console.log("Current selected image:", selectedImage);
  };

  ////////////////////////////////////////////////////////////////
  const OnchangeBio = (event) => {
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
    setResidentId(parsedValue);
  };

  ///////////////////////////////////////////////////////////////////////////
  const fetchProfile = useCallback(async () => {
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
      console.log(residentProfile);
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
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchProfile();
      showToastSuccess();
      navigation.navigate("ProfileScreen");
    } catch (error) {
      console.error("Error Updating resident profile:", error);
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
      const blob = await response.blob();

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
      console.error("Error updating profile photo:", error);
      throw new Error(error);
    }
  };
  ////////////////////////////////////////////////////////////////////////////
  const fetchProfilePhoto = async () => {
    if (user) {
      await user.reload();
      
      console.log("photo uri is "+user.imageUrl)

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
      console.error("Error getting profile photo:", error);
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
      <ScrollView contentContainerStyle={{ backgroundColor: "white", flex: 1 }}>
        <View style={styles.bigContainer}>
          <View style={styles.containerPhoto}>
            {selectedImage !== "data:image/jpeg;base64," ? (
              <Image source={{ uri: selectedImage }} style={styles.image} />
            ) : (
              <Image
                source={require("../../../assets/profileimage.jpg")}
                style={styles.image}
              />
            )}
            <TouchableOpacity
              style={styles.picker}
              onPress={() => handleImageSelection()}
            >
              <View style={styles.iconContainer}>
                <EvilIcons name="camera" size={20} color="white" />
              </View>
            </TouchableOpacity>
            <View style={styles.containerText}>
              <Text style={styles.textOne}>{fullName}</Text>
              {residentId ? (
                <Text style={styles.textTwo}>ID: {residentId}</Text>
              ) : (
                <Text style={styles.textTwo}></Text>
              )}
            </View>
          </View>
          <ScrollView
            contentContainerStyle={styles.containerInput}
            nestedScrollEnabled
          >
            <Text
              style={{ color: "grey", marginLeft: "-60%", marginBottom: -15 }}
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
                style={{ color: "red", marginLeft: "-20%", marginTop: "-5%" }}
              >
                {errorFullName}
              </Text>
            ) : null}

            <Text
              style={{ color: "grey", marginLeft: "-60%", marginBottom: -15 }}
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
                    justifyContent: "flex-end",
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
                    style={{ marginLeft: -25 }}
                  />
                </TouchableOpacity>
              )}
            </View>
            <Text
              style={{ color: "grey", marginLeft: -290, marginBottom: -15 }}
            >
              {t("Bio")}
            </Text>
            <TextInput
              style={styles.input}
              value={bio}
              onChangeText={OnchangeBio}
              placeholder="Bio"
            />
            {errorBio ? <Text style={styles.errorText}>{errorBio}</Text> : null}
            <Text
              style={{ color: "grey", marginLeft: -260, marginBottom: -15 }}
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
            <View style={styles.containerNested}>
              <TextInput
                style={styles.input}
                value={age.toString()}
                onChangeText={OnchangeAge}
                placeholder="Age"
                keyboardType="numeric"
              />
              {errorAge ? <Text style={styles.errorText}>{errorAge}</Text> : null}
              <TextInput
                style={styles.input}
                value={residentId.toString()}
                onChangeText={OnchangeResidentId}
                placeholder="Resident ID"
                keyboardType="numeric"
              />
              {errorResidentId ? <Text style={styles.errorText}>{errorResidentId}</Text> : null}
            </View>
            <View style={styles.genderCont}>
              <Text style={styles.gender}>{t("Gender")}</Text>
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

            <TouchableOpacity onPress={handleOpenSubmit} style={styles.button}>
              <Text style={styles.textBtn}>{t("Save")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        <SuccessUpdatingProfile
          handleCloseSubmit={handleCloseSubmit}
          modalVisible={modalVisible}
          showToastSuccess={showToastSuccess}
          onConfirm={UpdateProfile}
        />
      </ScrollView>
    </View>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  lastCont: {

    backgroundColor: "white",
    flex: 1,
  },
  bigContainer: {

    justifyContent: "space-between",
    alignItems: "center",
    gap: 5,
    height: height * 0.8,
    backgroundColor: "white",
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
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    padding: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 5,
    width: width * 0.9,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  containerNested: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: width * 0.9,
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
    marginLeft: 17,
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
  button: {
    backgroundColor: Colors.LIGHT_PURPLE,
    padding: 15,
    alignItems: "center",
    borderRadius: 5,
    width: width * 0.9,
    height: height * 0.07,
  },
  textBtn: {
    color: "#fff",
    fontWeight: "bold",
  },
  lastCont: {
    backgroundColor: "white",
    flex: 1,
  },
  bigContainer: {
    justifyContent: "space-between",
    alignItems: "center",
    gap: 5,
    height: height * 0.8,
    backgroundColor: "white",
  },
  containerInput: {
    justifyContent: "center",
    alignItems: "center",
  },
  interestsContainer: {
    marginVertical: 10,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 5,
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
