export interface ThemeLayout {
  headerHeight: string;
  controlHeight: string;
  sidebarWidth: string;
}

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary?: string;
  bgQuaternary?: string;
  borderPrimary: string;
  borderSecondary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary?: string;
  textMuted?: string;
  accent: string;
  accentTransparent: string;
  accentBorder: string;
  accentMuted?: string;
  accentTwo?: string;
  accentTwoTransparent?: string;
  accentTwoBorder?: string;
  accentTwoMuted?: string;
  link: string;
  linkHover: string;
}

export interface ThemeTypography {
  fontFamilyBase: string;
  fontWeightLight: number;
  fontWeightRegular: number;
  fontWeightBold: number;
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeBorderRadius {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  full: string;
}

export interface Theme {
  layout: ThemeLayout;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
}

export const theme: Theme = {
  layout: {
    headerHeight: '60px',
    controlHeight: '100px',
    sidebarWidth: '260px',
  },
  colors: {
    bgPrimary: '#212121',
    bgSecondary: '#1a1a1a',
    bgTertiary: '#2d2d2d',
    bgQuaternary: '#333333',
    borderPrimary: 'rgb(180 180 180)',
    borderSecondary: 'rgb(62, 62, 62)',
    textPrimary: '#ffffff',
    textSecondary: 'rgb(180 180 180)',
    textTertiary: '#bbbbbb',
    textMuted: 'rgb(150, 150, 150)',
    accent: 'rgb(247, 73, 40)',
    accentTransparent: 'rgba(247, 73, 40, 0.75)',
    accentMuted: 'rgba(247, 73, 40, 0.4)',
    accentTwo: 'rgb(147, 130, 215)',
    accentTwoTransparent: 'rgba(147, 130, 215, 0.75)',
    accentTwoMuted: 'rgba(147, 130, 215, 0.4)',
    accentTwoBorder: 'rgba(147, 130, 215, 0.2)',
    accentBorder: 'rgba(255, 67, 62, 0.2)',
    link: '#1e90ff',
    linkHover: '#87cefa',
  },
  typography: {
    fontFamilyBase: "'Inter', system-ui, -apple-system, sans-serif",
    fontWeightLight: 200,
    fontWeightRegular: 400,
    fontWeightBold: 700,
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    full: '9999px',
  },
};
