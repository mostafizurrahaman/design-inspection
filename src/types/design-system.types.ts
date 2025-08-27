// types/design-system.types.ts

export interface DesignSystemOutput {
   meta: MetaData;
   typography: Typography;
   colors: Colors;
   spacing: Spacing;
   layout: Layout;
   shadows: Shadow[];
   borders: Borders;
   animations: Animations;
   accessibility: Accessibility;
   stats: Statistics;
}

export interface MetaData {
   url: string;
   analyzedAt: string;
   title: string;
   favicon?: string;
   screenshot?: string;
   viewport?: string;
   performance: {
      totalStyles: number;
      uniqueColors: number;
      fontFamilies: number;
      cssFiles: number;
   };
}

export interface Typography {
   scale: {
      base: string | null;
      ratio: number | null;
      sizes: string[];
   };
   fonts: FontFamily[];
   styles: {
      heading: Record<string, TextStyle>;
      body: Record<string, TextStyle>;
      ui: Record<string, TextStyle>;
   };
}

export interface FontFamily {
   id: string;
   family: string;
   fallbacks: string[];
   variants: FontVariant[];
}

export interface FontVariant {
   weight: string | number;
   style: string;
   usage: number;
   contexts: string[];
}

export interface TextStyle {
   fontSize: string;
   fontWeight: string | number;
   lineHeight: string | number;
   letterSpacing: string;
   fontFamily: string;
   textTransform?: string;
   samples?: string[];
}

export interface Colors {
   primitives: Record<string, Record<string, string>>;
   semantic: SemanticColors;
   gradients: Gradient[];
}

export interface SemanticColors {
   primary: ColorVariant;
   secondary: ColorVariant;
   background: Record<string, string>;
   text: Record<string, string>;
   border: Record<string, string>;
   status: Record<string, string>;
}

export interface ColorVariant {
   base: string;
   hover?: string;
   pressed?: string;
   disabled?: string;
   usage?: number;
}

export interface Gradient {
   name: string;
   type: "linear" | "radial";
   angle?: string;
   stops: string[];
   usage: number;
}

export interface Spacing {
   base: number | null;
   scale: number[];
   patterns: {
      containerPadding: string | null;
      sectionGap: string | null;
      componentGap: string | null;
      elementGap: string | null;
   };
}

export interface Layout {
   breakpoints: Record<string, string>;
   container: {
      maxWidth: string;
      padding: string;
      centered: boolean;
   };
   grid: {
      columns: number;
      gap: string;
   };
}

export interface Shadow {
   name: string;
   value: string;
   usage: number;
}

export interface Borders {
   radius: Record<string, string>;
   width: Record<string, string>;
}

export interface Animations {
   transitions: {
      fast: string;
      base: string;
      slow: string;
      properties: string[];
   };
   keyframes: {
      name: string;
      duration: string;
      easing: string;
   }[];
}

export interface Accessibility {
   contrastRatios: {
      [key: string]: number | ContrastIssue[];
   };
   focusIndicators: {
      present: boolean;
      style: string;
      color: string;
   };
}

export interface ContrastIssue {
   foreground: string;
   background: string;
   ratio: number;
   level: "fail" | "aa" | "aaa";
}

export interface Statistics {
   uniqueColors: number;
   uniqueFonts: number;
   totalElements: number;
   cssRules: number;
   mediaQueries: number;
   customProperties: number;
}

export interface ElementData {
   tagName: string;
   classList: string[];
   styles: ComputedStyles;
   text?: string;
}

export interface ComputedStyles {
   fontFamily?: string;
   fontSize?: string;
   fontWeight?: string;
   fontStyle?: string;
   lineHeight?: string;
   letterSpacing?: string;
   textTransform?: string;
   color?: string;
   backgroundColor?: string;
   backgroundImage?: string;
   borderColor?: string;
   borderWidth?: string;
   borderRadius?: string;
   padding?: string;
   paddingTop?: string;
   paddingRight?: string;
   paddingBottom?: string;
   paddingLeft?: string;
   margin?: string;
   marginTop?: string;
   marginRight?: string;
   marginBottom?: string;
   marginLeft?: string;
   gap?: string;
   display?: string;
   width?: string;
   maxWidth?: string;
   boxShadow?: string;
   transition?: string;
   transform?: string;
   opacity?: string;
   [key: string]: string | undefined;
}

export interface ScrapedData {
   url: string;
   screenshot?: string;
   stylesheets: StyleSheet[];
   inlineStyles: string[];
   elements: ElementData[];
   customProperties: Record<string, string>;
   meta: {
      title: string;
      favicon?: string;
      viewport?: string;
   };
}

export interface StyleSheet {
   href?: string;
   rules: string[] | CSSRuleData[];
   crossOrigin?: boolean;
}

export interface CSSRuleData {
   selector: string;
   declarations: string;
}
