import { useEffect } from "react";

/**
 * useDocumentTitle — set the browser tab title.
 * Restores the previous title when the component unmounts.
 */
export default function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    if (title) document.title = title;
    return () => { document.title = previous; };
  }, [title]);
}
