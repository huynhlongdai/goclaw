import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId = "default" | "lumos" | "obsidian";
export type ColorMode = "light" | "dark" | "system";
export type LoginBgStyle = "default" | "gradient" | "image";

export interface BrandConfig {
  appName: string;
  appTagline: string;
  logoDataUrl: string | null;
  faviconDataUrl: string | null;
  themeId: ThemeId;
  colorMode: ColorMode;
  accentHue: number | null;
  loginTitle: string;
  loginMessage: string;
  loginBgStyle: LoginBgStyle;
  showWorkModule: boolean;
  showTracesSection: boolean;
  showVaultSection: boolean;
}

interface BrandState extends BrandConfig {
  setTheme: (themeId: ThemeId) => void;
  setColorMode: (mode: ColorMode) => void;
  setAccentHue: (hue: number | null) => void;
  setAppName: (name: string) => void;
  setAppTagline: (tagline: string) => void;
  setLogo: (dataUrl: string | null) => void;
  setFavicon: (dataUrl: string | null) => void;
  setLoginTitle: (title: string) => void;
  setLoginMessage: (msg: string) => void;
  setLoginBgStyle: (style: LoginBgStyle) => void;
  setFeatureFlag: (key: "showWorkModule" | "showTracesSection" | "showVaultSection", val: boolean) => void;
  reset: () => void;
}

const DEFAULTS: BrandConfig = {
  appName: "GoClaw",
  appTagline: "AI Agent Platform",
  logoDataUrl: null,
  faviconDataUrl: null,
  themeId: "default",
  colorMode: "system",
  accentHue: null,
  loginTitle: "Đăng nhập",
  loginMessage: "",
  loginBgStyle: "default",
  showWorkModule: true,
  showTracesSection: true,
  showVaultSection: true,
};

export const useBrandStore = create<BrandState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setTheme: (themeId) => set({ themeId }),
      setColorMode: (colorMode) => set({ colorMode }),
      setAccentHue: (accentHue) => set({ accentHue }),
      setAppName: (appName) => set({ appName }),
      setAppTagline: (appTagline) => set({ appTagline }),
      setLogo: (logoDataUrl) => set({ logoDataUrl }),
      setFavicon: (faviconDataUrl) => set({ faviconDataUrl }),
      setLoginTitle: (loginTitle) => set({ loginTitle }),
      setLoginMessage: (loginMessage) => set({ loginMessage }),
      setLoginBgStyle: (loginBgStyle) => set({ loginBgStyle }),
      setFeatureFlag: (key, val) => set({ [key]: val }),
      reset: () => set(DEFAULTS),
    }),
    { name: "goclaw:brand" },
  ),
);
