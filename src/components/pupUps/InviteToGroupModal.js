import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import Colors from "../../../assets/Colors";
import Axios from 'axios';
import { APP_ENV } from '../../utils/BaseUrl';
import { encode } from "base64-arraybuffer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

const InviteToGroupModal = ({ isVisible, onClose, groupId }) => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [data, setData] = useState([]);
  const [userIds, setUserIds] = useState([]);

  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const fetchCurrentUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        setCurrentUserId(userId);
      } catch (error) {
        console.error("Error getting current user ID:", error);
      }
    };

    fetchCurrentUserId();
  }, []);

  const showUserAlreadyInGroup = () => {
    Toast.show({
      type: "error",
      text1: `Invitee is already a member of the group.`,
      visibilityTime: 3000,
      autoHide: true,
    });
  };

  // useEffect(() => {
  //   const fetchProfilePhotos = async () => {
  //     try {
  //       const promises = userIds.map(async (userId) => {
  //         const response = await Axios.get(
  //           `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getprofilephoto/${userId}`,
  //           { responseType: "arraybuffer" }
  //         );
  //         const base64Image = encode(response.data);
  //         return response.data;
  //       });
  //       const profilePics = await Promise.all(promises);
  //       setProfilePic(profilePics);
  //     } catch (error) {
  //       console.error("Error getting resident profile photos:", error.message);
  //     }
  //   };

  //   fetchProfilePhotos();
  // }, [userIds]);

  const SearchUsers = async (fullName) => {
    try {
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/usersByFullName?fullName=${fullName}`
      );

      if (response.data && Array.isArray(response.data)) {
        const usersProfiles = response.data;
        const filteredUsers = usersProfiles.filter(
          (user) => user.id !== currentUserId
        );
        setData(filteredUsers);
        const ids = filteredUsers.map((user) => user.id);
        setUserIds(ids);
      } else {
        console.log("No Users found.");
        setData([]);
      }
    } catch (error) {
      console.error("Error getting User profile:", error);
    }
  };

  const InviteUserToGroup = async () => {
  try {
    const inviterId = currentUserId;
    if (!selectedFriends || selectedFriends.length === 0) {
      throw new Error("No friends selected for invitation.");
    }

    const inviteeIds = selectedFriends.map((user) => {
      if (!user.id) {
        throw new Error(`User object missing 'id': ${JSON.stringify(user)}`);
      }
      return user.id;
    });

  console.log("Inviting users:", inviteeIds);

    const response = await Promise.all(
      inviteeIds.map((id) => 
      
        Axios.post(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/inviteToGroup/${groupId}/${inviterId}/${id}`)
      )
    );

    console.log("Response", response.map((res) => res.data));

    const responseMessages = response.map((res) => res.data).join(", ");

    Toast.show({
      type: "success",
      text1: responseMessages,
      visibilityTime: 3000,
      autoHide: true,
    });

    setSelectedFriends([]);
  } catch (error) {
    console.error("Error inviting to Group", error.message || error);
  }
};

  const handleFriendSelection = (user) => {
    if (!selectedFriends.some((friend) => friend.id === user.id)) {
      setSelectedFriends([...selectedFriends, user]);
    } else {
      setSelectedFriends(
        selectedFriends.filter((friend) => friend.id !== user.id)
      );
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 20,
            padding: 20,
            width: "90%",
            maxWidth: 500,
            marginTop: "20%",
          }}
        >
          <View
            style={{
              borderTopColor: Colors.GunmetalGray,
              borderRadius: 13,
              borderTopWidth: 4,
              marginTop: -10,
              width: 40,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          />
          <View
   style={{
    flexDirection: "row",
    backgroundColor: Colors.PLATINUM,
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center", // <== This ensures vertical centering
            }}
          >
            <AntDesign
              name="search1"
              size={20}
              style={{
                marginLeft: "2%",
              }}
            />
            <TextInput
              placeholder="Search"
              keyboardType="default"
              style={{ marginLeft: 10, flex: 1 }}
              value={searchKeyword}
              onChangeText={(text) => {
                setSearchKeyword(text);
                SearchUsers(text);
              }}
            />
          </View>
          <ScrollView style={{ height: 300 }}>
            {data.map((user, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleFriendSelection(user)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10, 
                  paddingVertical: 5, 
                }}
              >
                <Image
                  source={{ uri: user.residentProfile.profilephoto }}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    borderColor: selectedFriends.some(
                      (friend) => friend.id === user.id
                    )
                      ? Colors.LIGHT_PURPLE
                      : "transparent",
                    borderWidth: selectedFriends.some(
                      (friend) => friend.id === user.id
                    )
                      ? 2
                      : 0,
                  }}
                />
                <Text style={{ marginLeft: 10 }}>
                  {user.residentProfile.fullName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedFriends.length > 0 && (
            <TouchableOpacity
              style={{
                backgroundColor: Colors.LIGHT_PURPLE,
                borderRadius: 10,
                padding: 10,
                alignItems: "center",
                marginTop: 10,
              }}
              onPress={() => InviteUserToGroup()}
            >
              <Text style={{ color: "white" }}>Send Invitations</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default InviteToGroupModal;
