import React from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons"; 
import Colors from "../../../assets/Colors";

const Termsofservices = ({ isVisible, onClose }) => {
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
            padding: 20,
            borderRadius: 20,
            borderColor:Colors.PURPLE,
            width: "80%",
            marginTop: "20%", 
            marginBottom: "20%", 
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: "absolute",
              top: 5,
              left: 250,
              padding: 5,
              zIndex: 1,
            }}
          >
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            Terms of Services
          </Text>
          <ScrollView>
            {/* Add your Terms of Services content here */}
            <Text>
              Welcome to ExampleApp! By accessing or using ExampleApp, you agree
              to be bound by these terms of service. If you disagree with any
              part of the terms, you may not access the app.
              {"\n\n"}
              **1. Description of Service** ExampleApp is a mobile application
              that allows users to [brief description of app's purpose and
              features].
              {"\n\n"}
              **2. User Accounts** - You may be required to create an account to
              access certain features of the app. - You are responsible for
              maintaining the security of your account and password. - You must
              notify us immediately of any unauthorized use of your account.
              {"\n\n"}
              **3. User Conduct** - You agree not to engage in any unlawful or
              prohibited activities while using ExampleApp. - You agree not to
              harass, abuse, or harm other users of the app.
              {"\n\n"}
              **4. Content Ownership** - You retain ownership of any content you
              upload, share, or create within ExampleApp. - By submitting
              content to ExampleApp, you grant us a non-exclusive, royalty-free
              license to use, reproduce, modify, and distribute your content.
              {"\n\n"}
              **5. Privacy Policy** - Your use of ExampleApp is subject to our
              Privacy Policy, which can be found [link to privacy policy].
              {"\n\n"}
              **6. Intellectual Property Rights** - All trademarks, copyrights,
              and other intellectual property rights associated with ExampleApp
              are owned by [App Developer]. - You agree not to use any
              trademarks, logos, or other proprietary information without prior
              written consent.
              {"\n\n"}
              **7. Limitation of Liability** - ExampleApp and its affiliates
              will not be liable for any direct, indirect, incidental, special,
              or consequential damages arising out of the use or inability to
              use the app.
              {"\n\n"}
              **8. Indemnification** - You agree to indemnify and hold harmless
              ExampleApp and its affiliates from any claims, losses,
              liabilities, damages, or expenses arising from your use of the
              app.
              {"\n\n"}
              **9. Changes to Terms** - We reserve the right to modify or update
              these terms of service at any time without prior notice. - Your
              continued use of ExampleApp after any changes to the terms
              constitutes acceptance of the revised terms.
              {"\n\n"}
              **10. Governing Law and Dispute Resolution** - These terms of
              service are governed by the laws of [jurisdiction]. - Any disputes
              arising out of or relating to these terms will be resolved through
              arbitration in [jurisdiction].
            </Text>
          </ScrollView>
         
        </View>
      </View>
    </Modal>
  );
};

export default Termsofservices;
