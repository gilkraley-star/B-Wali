import React from "react";
import { Keyboard, Pressable, StyleSheet, TextInput, View, ViewProps, findNodeHandle } from "react-native";

// Un tap en dehors du champ en cours ferme le clavier (partout, y compris dans les fenêtres qui s'ouvrent par-dessus).
let start: { x: number; y: number; f: any } | null = null;
export function KeyboardTapDismiss({ children, style, ...rest }: ViewProps) {
  return (
    <View {...rest} style={[{ flex: 1 }, style]}
      onTouchStart={(e) => { start = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY, f: (TextInput as any).State?.currentlyFocusedInput?.() }; }}
      onTouchEnd={(e) => {
        const st = start; start = null; const target = e.target;
        if (!st || !st.f || Math.hypot(e.nativeEvent.pageX - st.x, e.nativeEvent.pageY - st.y) > 12) return;
        setTimeout(() => {
          const now = (TextInput as any).State?.currentlyFocusedInput?.();
          if (now && now === st.f) { try { if ((findNodeHandle(now as any) as any) === (target as any)) return; } catch {} Keyboard.dismiss(); }
        }, 90);
      }}>
      {children}
    </View>
  );
}
// Fond sombre d'une fenêtre : un tap ferme le clavier d'abord, puis la fenêtre.
export function Backdrop({ onClose }: { onClose: () => void }) {
  return <Pressable style={StyleSheet.absoluteFill} onPress={() => { if ((Keyboard as any).isVisible?.()) Keyboard.dismiss(); else onClose(); }} />;
}
