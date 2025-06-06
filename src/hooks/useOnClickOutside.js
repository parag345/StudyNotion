import { useEffect } from "react";


export default function useOnClickOutside(ref, handler) {
  useEffect(() => {
    // Define the listener function to be called on click/touch events
    const listener = (event) => {
      
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      
      handler(event);
    };

    
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]); // Only run this effect when the ref or handler function changes
}