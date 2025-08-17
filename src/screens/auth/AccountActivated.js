import {
  View,
  Text,
  Image,
  SafeAreaView,
  TouchableOpacity,
  ImageBackground,
  Dimensions
} from "react-native";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import Colors from "../../../assets/Colors";
import { useNavigation } from "@react-navigation/native";

const AccountActivated = () => {
  const navigation = useNavigation();
  const { width, height } = Dimensions.get('window');
  
  const HandleLoginNavigation = () => {
    navigation.navigate("Log-In");
  };
  
  return (
    <ImageBackground
      source={require('../../../assets/ImgBackGoung.jpg')}
      style={{ flex: 1, resizeMode: 'cover' }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={{
          flexDirection: 'column',
          alignItems: 'flex-start',
          marginBottom: height * 0.015,
          marginTop: 0
        }}>
          <View style={{
            width: width * 1,
            height: height * 0.08,
            backgroundColor: Colors.LIGHT_PURPLE,
            paddingLeft: width * 0.040,
            justifyContent: 'center',
            top: 0
          }}>
            <Image
              source={require('../../../assets/Icons/TawasalnaLogoW1.png')}
              style={{ width: width * 0.4, height: height * 0.06, marginRight: width * 0.02 }}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          marginTop: -height * 0.07
        }}>
          <View style={{ 
            marginBottom: height * 0.05,
            alignItems: 'center'
          }}>
            <Image 
              source={require("../../../assets/AccountActivated.jpg")} 
              style={{ width: width * 0.6, height: height * 0.3 }}
              resizeMode="contain"
            />
          </View>
          
          <View style={{ 
            marginBottom: height * 0.05,
            alignItems: 'center',
            paddingHorizontal: width * 0.1
          }}>
            <Text style={{
              fontSize: width * 0.06,
              fontWeight: "bold",
              color: Colors.WHITE,
              textShadowColor: Colors.LIGHT_PURPLE,
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 10,
              textAlign: 'center',
              lineHeight: width * 0.08
            }}>
              Your account has been successfully activated!
            </Text>
          </View>
          
          <View style={{ 
            alignItems: "center",
            marginTop: height * 0.02
          }}>
            <TouchableOpacity
              onPress={HandleLoginNavigation}
              style={{
                flexDirection: "row",
                borderColor: Colors.WHITE,
                borderWidth: 2,
                borderRadius: width * 0.03,
                padding: width * 0.03,
                marginBottom: height * 0.03,
                width: width * 0.8,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: Colors.LIGHT_PURPLE,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <MaterialIcons
                name="arrow-forward"
                size={24}
                color={Colors.WHITE}
              />
              <Text style={{ 
                fontWeight: "bold", 
                marginLeft: 10,
                color: Colors.WHITE,
                fontSize: width * 0.05
              }}>
                Proceed with login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Copyright Notice */}
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              bottom: height * 0.05,
              left: 0,
              right: 0,
            }}
          >
            <Text style={{ color: 'gray', fontSize: width * 0.035 }}>
              © {new Date().getUTCFullYear()} - Tawasalna - All Rights Reserved.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default AccountActivated;
