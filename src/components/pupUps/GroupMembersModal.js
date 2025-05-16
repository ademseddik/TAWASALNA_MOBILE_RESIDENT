import { View, Text, Modal, TouchableOpacity, FlatList, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { encode } from "base64-arraybuffer";
import Axios from 'axios';
import { APP_ENV } from '../../utils/BaseUrl';
import { Ionicons } from "@expo/vector-icons"; 


const GroupMembersModal = ({ isVisible, onClose, members }) => {

  const [profilePics, setProfilePics] = useState([]);


 useEffect(() => {
   //console.log("Members:", members);

   if (members) {
     const fetchProfilePhotos = async () => {
       try {
         const promises = members.map(async (member) => {
           const response = await Axios.get(
             `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getprofilephoto/${member.id}`,
             { responseType: "arraybuffer" }
           );
           const base64Image = encode(response.data);
           return `data:image/jpeg;base64,${base64Image}`;
         });
         const profilePics = await Promise.all(promises);
         console.log("Profile pics length:", profilePics.length);
         setProfilePics(profilePics);
       } catch (error) {
         console.error(
           "Error getting resident profile photos for Home:",
           error.message
         );
       }
     };

     fetchProfilePhotos();
   }
 }, [members]);


  return (
    <Modal
      animationType="fade"
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
            padding: 20,
            borderRadius: 20,
            borderColor: Colors.PURPLE,
            width: "80%",
            height: "30%",
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              padding: 5,
            }}
          >
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          {members && members.length > 0 ? (
            <FlatList
              data={members}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  { <Image
                  source={{
                    uri:
                      profilePics[index] || "../../../assets/photoprofil.png",
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    marginRight: 10,
                  }}
                /> }
                  <Text>{item.residentProfile.fullName}</Text>
                </View>
              )}
            />
          ) : (
            <Text>No members available</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default GroupMembersModal;
