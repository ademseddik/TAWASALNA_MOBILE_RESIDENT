import React, { useState } from "react";
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

const SendModel = ({ isVisible, onClose }) => {
  const [searchKeyword, setSearchKeyword] = useState(""); 
  const [selectedFriends, setSelectedFriends] = useState([]); 

  const friends = [
    {
      userName: "Jack Gre",
      userImg: require("../../../assets/default-avatar.jpg"),
    },
    {
      userName: "Hamza",
      userImg: require("../../../assets/default-avatar.jpg"),
      messageTime: "2 hours ago",
    },
    {
      userName: "Ken William",
      userImg: require("../../../assets/default-avatar.jpg"),
    },
    {
      userName: "Selina Paul",
      userImg: require("../../../assets/default-avatar.jpg"),
    },
    {
      userName: "Christy Alex",
      userImg: require("../../../assets/default-avatar.jpg"),
    },
    {
      userName: "Jack Gre",
      userImg: require("../../../assets/default-avatar.jpg"),
    },
    {
      userName: "Hamza",
      userImg: require("../../../assets/default-avatar.jpg"),
      messageTime: "2 hours ago",
    },
    {
      userName: "Ken William",
      userImg: require("../../../assets/default-avatar.jpg"),
    },
    {
      userName: "Selina Paul",
      userImg: require("../../../assets/default-avatar.jpg"),
    },
    {
      userName: "Christy Alex",
      userImg: require("../../../assets/default-avatar.jpg"),
    },
  ];

  const handleFriendSelection = (userName) => {
    const index = selectedFriends.indexOf(userName);
    if (index === -1) {
      setSelectedFriends([...selectedFriends, userName]);
    } else {
      const updatedFriends = [...selectedFriends];
      updatedFriends.splice(index, 1);
      setSelectedFriends(updatedFriends);
    }
  };

  const filteredFriends = friends.filter((friend) =>
    friend.userName.toLowerCase().includes(searchKeyword.toLowerCase())
  );

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
            width: "100%",
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
              top: "8%",
              marginBottom: "7%",
              borderRadius: 13,
              padding: 10,
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
              style={{ left: "80%" }}
              value={searchKeyword}
              onChangeText={(text) => setSearchKeyword(text)} 
            />
          </View>
          <ScrollView style={{ top: "3%", height: 300 }}>
            {filteredFriends.map((friend, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleFriendSelection(friend.userName)} 
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Image
                  source={friend.userImg}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    borderColor: selectedFriends.includes(friend.userName)
                      ? Colors.LIGHT_PURPLE
                      : "transparent", 
                    borderWidth: selectedFriends.includes(friend.userName)
                      ? 2
                      : 0, 
                  }}
                />
                <Text style={{ marginLeft: 10 }}>{friend.userName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedFriends.length > 0 && ( 
            <TouchableOpacity
              style={{
                backgroundColor:Colors.LIGHT_PURPLE,
                borderRadius: 10,
                padding: 10,
                alignItems: "center",
                marginTop: 10,
              }}
              onPress={() => {
                console.log("Sending post to selected friends");
              }}
            >
              <Text style={{ color: "white" }}>Send</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default SendModel;
