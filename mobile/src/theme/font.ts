import { StyleSheet, Text } from "react-native";

// Police de l'appli partout (Inter, embarquée) : évite que certains téléphones utilisent leur propre police,
// dont les mesures différentes coupaient les mots (« Fatigu », « Autr », « La »).
const T: any = Text;
if (typeof T.render === "function" && !T.__waliFont) {
  T.__waliFont = true;
  const orig = T.render;
  T.render = function (props: any, ref: any) {
    const f: any = StyleSheet.flatten(props.style) || {};
    if (!f.fontFamily) {
      const w = String(f.fontWeight || "400");
      const n = w === "bold" ? 700 : parseInt(w, 10) || 400;
      const fam = n >= 700 ? "Inter_700Bold" : n >= 600 ? "Inter_600SemiBold" : n >= 500 ? "Inter_500Medium" : "Inter_400Regular";
      const { fontWeight, ...rest } = f;
      props = { ...props, style: [rest, { fontFamily: fam }] };
    }
    return orig.call(this, props, ref);
  };
}
