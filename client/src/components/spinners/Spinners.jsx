import React from "react";
import { 
  Atom, OrbitProgress, Mosaic, ThreeDot, BlinkBlur, 
  Commet, FourSquare, LifeLine, Riple, Slab, TrophySpin 
} from "react-loading-indicators";

// 1. The Configuration Map
// Add new spinners here if the library adds more later
const SPINNER_VARIANTS = {
  atom: Atom,
  orbit: OrbitProgress,
  mosaic: Mosaic,
  dots: ThreeDot,
  blink: BlinkBlur,
  commet: Commet,
  square: FourSquare,
  lifeline: LifeLine,
  ripple: Riple,
  slab: Slab,
  trophy: TrophySpin,
};

/**
 * Universal Spinner Component
 * 
 * @param {string} variant - The type of spinner (e.g., "atom", "mosaic", "dots")
 * @param {string} mode - "inline" | "box" | "fullscreen"
 * @param {string} size - "small" | "medium" | "large"
 * @param {string} color - Hex color code
 * @param {string} text - Optional text to show below
 */
const GlobalSpinner = ({ 
  variant = "atom", 
  mode = "inline", // Options: 'inline', 'box', 'fullscreen'
  size = "medium", 
  color = "#32cd32", 
  text = "", 
  textColor = "" 
}) => {
  
  // 2. Safe Selection: Fallback to 'Atom' if typo exists
  const SelectedSpinner = SPINNER_VARIANTS[variant.toLowerCase()] || Atom;

  // 3. Define Styles for different modes
  const styles = {
    // Just sits in the flow
    inline: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    // Centers inside a parent div (good for Cards/Tables)
    box: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      minHeight: '150px', // Minimum height to look good
    },
    // Covers the entire screen
    fullscreen: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)', // White w/ opacity
      backdropFilter: 'blur(4px)', // Glass effect
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }
  };

  const currentStyle = styles[mode] || styles.inline;

  return (
    <div style={currentStyle}>
      <SelectedSpinner 
        color={color} 
        size={size} 
        text="" 
        textColor="" 
      />
      
      {text && (
        <span style={{ 
          marginTop: '12px', 
          fontFamily: 'sans-serif', 
          fontSize: '14px',
          fontWeight: '600',
          color: textColor || color 
        }}>
          {text}
        </span>
      )}
    </div>
  );
};

export default GlobalSpinner;


//Scenario A
    // if (isLoading) {
    // return (
    //     <GlobalSpinner 
    //         variant="mosaic" 
    //         mode="fullscreen" 
    //         text="Loading your Dashboard..." 
    //         color="#2563eb" 
    //     />
    //     );
    // }

//Scenario B
{/* <div className="card-body">
  {isFetching ? (
    <GlobalSpinner 
      variant="dots" 
      mode="box" 
      size="small" 
    />
  ) : (
    <MyTableData />
  )}
</div> */}

// Scenario C: Button Loading (Inline)
{/* <button disabled={isSubmitting}>
  {isSubmitting ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <GlobalSpinner variant="atom" size="small" color="white" />
      <span>Processing...</span>
    </div>
  ) : (
    "Submit"
  )}
</button> */}

  