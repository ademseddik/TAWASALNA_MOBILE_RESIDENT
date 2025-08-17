import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5, Ionicons } from 'react-native-vector-icons';
import Colors from '../../assets/Colors';

const GroupActions = ({
  isMember,
  isAdmin,
  isInvited,
  isRequesting,
  groupType,
  joinedNow,
  onJoin,
  onLeave,
  onInvite,
  onAccept,
  onReject,
  onCancelRequest,
  onToggleMembers,
}) => {
  // Private group - not a member
  if (!isMember && groupType === "PRIVATE") {
    return (
      <View style={{ flexDirection: "row", marginTop: 25 }}>
        <TouchableOpacity
          onPress={onJoin}
          style={{
            height: 30,
            width: "40%",
            borderColor: "gray",
            borderWidth: 0.3,
            borderRadius: 10,
            marginLeft: 10,
            alignItems: "center",
            flexDirection: "row",
          }}
        >
          <FontAwesome5
            name="user-friends"
            color="black"
            size={15}
            style={{ marginLeft: 18 }}
          />
          <Text style={{ fontSize: 17, marginLeft: 5 }}>Join</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Private group - invited
  if (isInvited && groupType === "PRIVATE") {
    return (
      <View style={{ flexDirection: "row", marginTop: 25 }}>
        <TouchableOpacity
          onPress={onAccept}
          style={{
            height: 30,
            width: "40%",
            borderColor: "gray",
            borderWidth: 0.3,
            borderRadius: 10,
            marginLeft: 10,
            alignItems: "center",
            flexDirection: "row",
          }}
        >
          <Text style={{ fontSize: 17, marginLeft: 5 }}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onReject}
          style={{
            height: 30,
            width: "40%",
            borderColor: "gray",
            borderWidth: 0.3,
            borderRadius: 10,
            marginLeft: 10,
            alignItems: "center",
            flexDirection: "row",
          }}
        >
          <Text style={{ fontSize: 17, marginLeft: 5 }}>Reject</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Private group - requesting to join
  if (isRequesting && groupType === "PRIVATE") {
    return (
      <View style={{ flexDirection: "row", marginTop: 25 }}>
        <TouchableOpacity
          onPress={onCancelRequest}
          style={{
            height: 30,
            width: "40%",
            borderColor: "gray",
            borderWidth: 0.3,
            borderRadius: 10,
            marginLeft: 10,
            alignItems: "center",
            flexDirection: "row",
          }}
        >
          <FontAwesome5
            name="user-friends"
            color="black"
            size={15}
            style={{ marginLeft: 18 }}
          />
          <Text style={{ fontSize: 17, marginLeft: 5 }}>cancel request</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Public group - invited
  if (isInvited && groupType === "PUBLIC") {
    return (
      <View style={{ flexDirection: "row", marginTop: 25, justifyContent: "center" }}>
        <TouchableOpacity
          onPress={onAccept}
          style={{
            height: 30,
            width: "40%",
            backgroundColor: Colors.LIGHT_PURPLE,
            borderColor: "gray",
            borderWidth: 0.3,
            borderRadius: 10,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 17, marginLeft: 5, color: Colors.WHITE, fontWeight: "bold" }}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onReject}
          style={{
            height: 30,
            width: "40%",
            borderColor: Colors.LIGHT_PURPLE,
            borderWidth: 1,
            borderRadius: 10,
            marginLeft: 10,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 17, marginLeft: 5, fontWeight: "bold" }}>Reject</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Public group - not a member
  if (!isMember && groupType === "PUBLIC") {
    return (
      <View style={{ flexDirection: "row", marginTop: 25 }}>
        <TouchableOpacity
          onPress={isMember || joinedNow ? onLeave : onJoin}
          style={{
            height: 30,
            width: "40%",
            borderColor: "gray",
            borderWidth: 0.3,
            borderRadius: 10,
            marginLeft: 10,
            alignItems: "center",
            flexDirection: "row",
          }}
        >
          <FontAwesome5
            name="user-friends"
            color="black"
            size={15}
            style={{ marginLeft: 29 }}
          />
          <Text style={{ fontSize: 17, marginLeft: 5 }}>
            {isMember || joinedNow ? "Member" : "Join"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Admin - can invite
  if (isAdmin) {
    return (
      <View style={{ flexDirection: "row", marginTop: 25 }}>
        <TouchableOpacity
          onPress={onInvite}
          style={{
            height: 30,
            width: "40%",
            borderColor: "gray",
            borderWidth: 0.3,
            borderRadius: 10,
            marginLeft: 40,
            alignItems: "center",
            backgroundColor: Colors.LIGHT_PURPLE,
            flexDirection: "row",
          }}
        >
          <Ionicons
            name="person-add-outline"
            color="white"
            size={15}
            style={{ marginLeft: 41 }}
          />
          <Text style={{ fontSize: 17, color: "white", marginLeft: 5 }}>
            Invite
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Member - can leave and invite
  return (
    <View style={{ flexDirection: "row", marginTop: 25 }}>
      <TouchableOpacity
        onPress={isMember || joinedNow ? onLeave : onJoin}
        style={{
          height: 30,
          width: "40%",
          borderColor: "gray",
          borderWidth: 0.3,
          borderRadius: 10,
          marginLeft: 10,
          alignItems: "center",
          flexDirection: "row",
        }}
      >
        <FontAwesome5
          name="user-friends"
          color="black"
          size={15}
          style={{ marginLeft: 29 }}
        />
        <Text style={{ fontSize: 17, marginLeft: 5 }}>
          {isMember || joinedNow ? "Member" : "Join"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onInvite}
        style={{
          height: 30,
          width: "40%",
          borderColor: "gray",
          borderWidth: 0.3,
          borderRadius: 10,
          marginLeft: 40,
          alignItems: "center",
          backgroundColor: Colors.LIGHT_PURPLE,
          flexDirection: "row",
        }}
      >
        <Ionicons
          name="person-add-outline"
          color="white"
          size={15}
          style={{ marginLeft: 41 }}
        />
        <Text style={{ fontSize: 17, color: "white", marginLeft: 5 }}>
          Invite
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default GroupActions; 