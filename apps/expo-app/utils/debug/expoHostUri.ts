import Constants from "expo-constants";

const { expoConfig } = Constants;

const getExpoHostUri = () => {
  console.log("expoConfig", expoConfig);
  return expoConfig?.hostUri?.split(":")[0];
};

export default getExpoHostUri;
