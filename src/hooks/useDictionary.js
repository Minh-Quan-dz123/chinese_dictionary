import { useEffect, useState } from "react";
import { loadDictionary } from "../dictionary/parser";

export default function useDictionary() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadDictionary().then(() => {
      setIsReady(true);
    });
  }, []);

  return isReady;
}