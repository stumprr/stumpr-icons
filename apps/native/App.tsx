import "./global.css";
import { Text, View } from "react-native";
import { HomeIcon } from "@stumpr/icons-react-native";

export default function App() {
	return (
		<View className="flex-1 items-center justify-center gap-4">
			<HomeIcon color="#3b82f6" />
			<Text className="text-xl font-semibold">Stumpr Icons</Text>
		</View>
	);
}
