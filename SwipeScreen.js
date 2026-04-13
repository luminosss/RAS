// SwipeScreen.js
import { View, Text, Image, PanResponder } from "react-native";

export default function SwipeScreen({ user }) {

 const panResponder = PanResponder.create({
  onStartShouldSetPanResponder: () => true,

  onPanResponderRelease: (e, gesture) => {

   if(gesture.dx > 120){
    console.log("LIKE ❤️");
   }

   if(gesture.dx < -120){
    console.log("PASS ❌");
   }
  }
 });

 return (
  <View {...panResponder.panHandlers}>
   <Image source={{ uri: user.photo }} style={{ height: 500 }} />
   <Text>{user.prenom}</Text>
  </View>
 );
}