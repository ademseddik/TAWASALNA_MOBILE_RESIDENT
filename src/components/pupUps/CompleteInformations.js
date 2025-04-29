import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {  MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {  useUser } from '@clerk/clerk-expo';
import { useTranslation } from "react-i18next";
import { APP_ENV } from '../../utils/BaseUrl';
import { Switch } from 'react-native';
import Colors from "../../../assets/Colors";


const CompleteInformations = ({ isVisible, onClose }) => {
  const [residentId, setResidentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [dateofbirthError, setDateOfBirthError] = useState("");
  const { t } = useTranslation();
  const { user } = useUser();






  const handleSignUp = async () => {
    if (new Date(dateOfBirth) > new Date()) {
      setDateOfBirthError("Date of birth cannot be in the future");
      return;
    }

    const userId = await AsyncStorage.getItem("userId");
    if (user) {
      await user.reload();
      console.log('Logged in user after reload:', {
          id: user,
          fullName: user.fullName,
          email: user.primaryEmailAddress?.emailAddress,
          profileImage: user.imageUrl,
      });


  } else {
     

  }
    setIsLoading(true);
    const provider = await AsyncStorage.getItem('socialProvider');
console.log(userId+"  and  "+APP_ENV.AUTH_PORT )
    try {
      const userId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("token");

     const responce= await Axios.put(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/updateresidenprofile/${userId}`,
        {
          residentId,
          provider:provider,
          dateOfBirth: new Date(dateOfBirth),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
     
      console.log("complete info successful:", responce.data);
      onClose();
    } catch (error) {
      console.error("complete info error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDatePicker = () => {
    setShowPicker(!showPicker);
  };

  const onchangeDatePicker = (event, selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
      setDateOfBirth(formattedDate);
    }
    setShowPicker(false);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity onPress={onClose}
      ActivityIndicator={1}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      }}>
        <View style={{
          backgroundColor: "white",
          padding: 20,
          borderRadius: 10,
          width: "90%",
          maxHeight: "80%",
        }}>
     
          <ScrollView>
            <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20,marginTop:10 }}>
              {t("Complete your informations")}
            </Text>

            <Text style={{ marginBottom: 4 }}>{t("Your ID")}</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}
              placeholder="Enter your ID number..."
              value={residentId}
              onChangeText={setResidentId}
            />

            <Text style={{ marginBottom: 4 }}>
              {t("Date Of Birth")}
              <Text style={{ color: dateofbirthError ? "red" : "black" }}>*</Text>
            </Text>
            <View style={{
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
            }}>
              {showPicker && (
                <DateTimePicker
                  mode="date"
                  display="spinner"
                  value={date}
                  onChange={onchangeDatePicker}
                />
              )}
              <TouchableOpacity
                onPress={toggleDatePicker}
                style={{ flexDirection: "row", justifyContent: "space-between" }}
              >
                <Text style={{ color: dateOfBirth ? "black" : "gray" }}>
                  {dateOfBirth || t("Select your date of birth")}
                </Text>
                <MaterialCommunityIcons name="calendar" size={24} color="black" />
              </TouchableOpacity>
            </View>

         
            <TouchableOpacity
              onPress={handleSignUp}
              style={{
                backgroundColor: Colors.PURPLE,
                padding: 16,
                borderRadius: 8,
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <Text style={{ color: "white" }}>{t("Submit")}</Text>
            </TouchableOpacity>
          </ScrollView>



          {isLoading && (
            <View style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <ActivityIndicator size="large" color={Colors.PURPLE} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default CompleteInformations;