import React from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from 'react-native-vector-icons';
import Colors from '../../assets/Colors';

const GroupHeader = ({
  groupPic,
  groupName,
  groupType,
  membersLength,
  onQrPress,
  children,
}) => (
  <View style={{ position: 'relative', marginBottom: 10 }}>
    {groupPic !== 'data:image/jpeg;base64,' ? (
      <Image
        style={{ width: '100%', height: 200, borderRadius: 10 }}
        source={{ uri: groupPic }}
        resizeMode="cover"
      />
    ) : (
      <Image
        source={require('../../assets/GroupPhotoPlaceHolder.jpeg')}
        style={{ width: '100%', borderWidth: 0.3, borderColor: 'black', height: 200, borderRadius: 10 }}
        resizeMode="cover"
      />
    )}
    {/* QR Code Button */}
    <TouchableOpacity
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 8,
        elevation: 4,
        zIndex: 2,
      }}
      onPress={onQrPress}
    >
      <Ionicons name="qr-code-outline" size={28} color={Colors.LIGHT_PURPLE} />
    </TouchableOpacity>
    <View style={{ flexDirection: 'row', marginTop: 15, marginLeft: 15, alignItems: 'center' }}>
      {groupType === 'PUBLIC' ? (
        <MaterialIcons name="public" size={20} />
      ) : null}
      <Text style={{ color: 'grey' }}> Group ({groupType?.toLowerCase()}) </Text>
      <Text> {membersLength} </Text>
      <Text style={{ color: 'grey' }}>members </Text>
    </View>
    <View style={{ flexDirection: 'row', marginTop: 15, marginLeft: 15 }}>
      <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 20 }}>{groupName}</Text>
    </View>
    {children}
  </View>
);

export default GroupHeader; 